import k from "../kaplayCtx";
import variableJump from "../abilities/variable-jump";

const optionDefaults = {
   char: 'mario-normal',
   debugText: null,
   size: 'sm',
};

export function makePlayer(pos, options = optionDefaults) {
   let { char, size, debugText } = Object.assign({}, optionDefaults, options);
   const prunThreshold = 1.2;
   const speeds = { walk: 350, turbo: 600, prun: 700, inc: 32 };
   const jumpForces = { sm: 1300, lg: 1350 };
   const skidSound = k.play('skid', { paused: true, loop: true, speed: 0.9, volume: 0.6 });
   const runSound = k.play('p-meter', { paused: true, loop: true });
   let lastPos = pos.clone();
   let runTime = 0;
   let momentum = 0;
   return k.add([
      k.sprite(char, { frame: 0 }),
      k.scale(4),
      k.area(),
      k.anchor('center'),
      k.pos(pos),
      k.body(),
      k.offscreen({ distance: 25 }),
      variableJump(),
      {
         add() {
            k.onButtonPress('jump', ()=>{
               if (!this.isGrounded()) return;
               const anim = `${this.curAnim()?.startsWith('run') ? 'pjump' : 'jump'}-${size}`;
               if (this.hasAnim(anim)) this.play(anim);
               k.play('jump');
               // Implement jump force based on momentum and run state
               let jumpForce = jumpForces[size];
               if (k.isButtonDown('turbo') && momentum) jumpForce *= 1.1;
               if (runTime>=prunThreshold) jumpForce *= 1.1;
               this.variableJump(jumpForce);
            });
            k.onUpdate(()=>{
               // Up/down take priority unless you're mid-jump
               const goUp = this.isGrounded() && k.isButtonDown('up');
               const goDown = !goUp && this.isGrounded() && k.isButtonDown('down');
               const goRight = !goUp && !goDown && k.isButtonDown('right');
               const goLeft = !goUp && !goDown && !goRight && k.isButtonDown('left');
               const goLeftOrRight = goLeft || goRight;
               const goTurbo = k.isButtonDown('turbo');
               const skidding = (goLeft && momentum>0) || (goRight && momentum<0);
               const lastPosDelta = Math.round(this.pos.dist(lastPos));
               const moving = lastPosDelta>0;
               // If running, track run time. You don't get credit while jumping.
               let runtimeMultiplier = goTurbo && goLeftOrRight && !skidding && this.isGrounded() ? 1 : -1.2;
               if (skidding || !moving) runtimeMultiplier = -4; // Take runtime credits away faster when skidding
               if (!this.isGrounded() && runTime===prunThreshold) runtimeMultiplier = 0; // Hold p-run state while in air
               runTime += k.dt() * runtimeMultiplier;
               if (runTime<0) runTime = 0;
               else if (runTime>prunThreshold) runTime = prunThreshold;
               // Check for p-run
               const prunning = goTurbo && goLeftOrRight && runTime>=prunThreshold;
               const maxSpeed = prunning ? speeds.prun : goTurbo ? speeds.turbo : speeds.walk;
               // Play sound effects
               if (prunning && runSound.paused) runSound.play();
               else if (!prunning && !runSound.paused) runSound.stop();
               if (skidding && this.isGrounded() && skidSound.paused) skidSound.play();
               else if (!skidding && !skidSound.paused) skidSound.stop();
               // Handle momentum build up and decay
               if (!goLeftOrRight) {
                  // Decay momentum
                  const momentumDir = momentum>0 ? 1 : -1;
                  momentum -= speeds.inc * momentumDir;
                  // Only slow down to zero, don't reverse when decaying
                  if ((momentumDir>0 && momentum<0) || (momentumDir<0 && momentum>0)) momentum=0;
               } else {
                  const goDir = goLeft ? -1 : 1;
                  // If mid-air, you can change direction a little faster (1.5x)
                  momentum += speeds.inc * goDir * (this.isGrounded() ? 1 : 1.5);
                  const momentumDir = momentum>0 ? 1 : -1;
                  // TODO: If you let go of turbo mid-jump, this stops them too fast mid-air.
                  if (Math.abs(momentum)>maxSpeed) momentum = maxSpeed * momentumDir;
               }
               let anim = `${skidding ? 'skid' : prunning ? 'run' : 'walk'}-${size}`;
               if (goDown && this.hasAnim(`duck-${size}`)) anim = `duck-${size}`;
               const animSpeed = Math.abs(momentum)/maxSpeed * (goTurbo ? 3 : 1.2);
               // Actually apply calculations to the characters
               lastPos = this.pos.clone();
               if (this.animSpeed!==animSpeed) this.animSpeed = animSpeed;
               if (momentum) {
                  this.flipX = momentum>0;
                  this.move(momentum, 0);
                  if (this.isGrounded() && this.hasAnim(anim) && this.curAnim()!==anim) this.play(anim);
                  if (this.animSpeed!==animSpeed) this.animSpeed = animSpeed;
               } else if (this.isGrounded()) {
                  if (goDown) this.play(anim);
                  else if (goUp && this.hasAnim(`lookup-${size}`) && !char.includes('raccoon')) this.play(`lookup-${size}`);
                  else this.frame = size==='sm' ? 0: 19;
               }
               // Debug text display
               if (debugText) {
                  debugText.text = `Character: ${char} (${size})\n`+
                     `Pos: ${this.pos.x.toFixed(0)}, ${this.pos.y.toFixed(0)} (Delta: ${lastPosDelta})\n`+
                     `Momentum: ${momentum}\n`+
                     `Run Time: ${runTime.toFixed(2)}s\n`+
                     `P-Running: ${prunning}\n`+
                     `Skidding: ${skidding}\n`+
                     `Anim: ${this.curAnim()} (${this.animSpeed.toFixed(1)}x)`;
               }
            });
         },
      },
   ]);
}