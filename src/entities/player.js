import k from "../kaplayCtx";
import variableJump from "../abilities/variable-jump";

const optionDefaults = {
   char: 'mario-normal',
   debugText: null,
   size: 'sm',
};

export function makePlayer(pos, options = optionDefaults) {
   let { char: _char, size: _size, debugText } = Object.assign({}, optionDefaults, options);
   const prunThreshold = 1.2;
   const speeds = { walk: 350, turbo: 600, prun: 700, inc: 32 };
   const jumpForces = { sm: 1300, lg: 1350 };
   const skidSound = k.play('skid', { paused: true, loop: true, speed: 0.9, volume: 0.6 });
   const runSound = k.play('p-meter', { paused: true, loop: true });
   let alive = true;
   let invulnerable = false;
   let frozen = false;
   let lastPos = pos.clone();
   let runTime = 0;
   let momentum = 0;
   function makePlayerAreaRect() {
      return _size === 'sm' ? new k.Rect(k.vec2(0, 0), 10, 15) : new k.Rect(k.vec2(0, 0), 13, 27);
   }
   return k.add([
      k.sprite(_char, { frame: 0, flipX: true }),
      k.scale(4),
      k.area({ shape: makePlayerAreaRect() }),
      k.anchor('bot'),
      k.pos(pos),
      k.body(),
      k.z(1),
      k.offscreen({ distance: 25 }),
      variableJump(),
      'player',
      {
         die() {
            if (_size!=='sm' || !alive || invulnerable) return;
            this.trigger('die');
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            alive = false;
            this.z = 1000;
            runSound.stop();
            skidSound.stop();
            k.play('die');
            this.play(`die-${_size}`);
            this.opacity = 1;
            this.scaleBy(1.2);
            k.wait(2.6, () => {
               this.isStatic = false;
               this.jump(jumpForces.lg);
            });
         },
         get size() {
            return _size;
         },
         set size(val) {
            // Do not set to small if character can't be small
            if (val==='sm' && !_char.endsWith('normal')) return;
            _size = val;
            this.area.shape = makePlayerAreaRect();
         },
         get char() {
            return _char;
         },
         set char(val) {
            _char = val;
            this.sprite = _char;
            // Only 'normal' chars can be small
            if (!_char.endsWith('normal') && _size==='sm') this.size = 'lg';
         },
         get isAlive() {
            return alive;
         },
         get isInvulnerable() {
            return invulnerable;
         },
         set isInvulnerable(val) {
            invulnerable = val;
         },
         grow() {
            if (_size==='lg' || !alive || frozen) return;
            frozen = true;
            const vel = this.vel.clone();
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            k.play('powerup');
            this.play('grow', { speed: 20 });
            k.wait(1, ()=>{
               this.stop();
               this.isStatic = false;
               frozen = false;
               this.vel = vel.scale(1.1);
               this.size = 'lg';
            });
         },
         hurt() {
            if (invulnerable) return;
            this.trigger('hurt');
            if (_size==='sm') {
               this.die();
               return;
            }
            invulnerable = true;
            frozen = true;
            const vel = this.vel.clone();
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            k.wait(2.5, ()=>invulnerable = false);
            k.play('hurt');
            // TODO: Animation does not play if play is touched by enemy when not moving.
            this.play('grow', { speed: 20 });
            k.wait(0.7, ()=>{
               this.isStatic = false;
               this.size = 'sm';
               this.vel = vel.scale(0.9);
               frozen = false;
            });
         },
         handleCollideEnemy(enemy, col) {
            if (!alive || frozen || !enemy.isAlive) return;
            // Must hit top part of enemy  with downward velocity to squash
            const thresholdY = enemy.pos.y - enemy.area.shape.pos.y - enemy.area.shape.height / 2;
            if ((this.pos.y <= thresholdY) && this.vel.y > 0) {
               enemy.squash();
               // We wait a tick to bounce in case we squash multiple enemies in one frame
               k.wait(0, ()=>{
                  if (this.isJumping()) return;
                  this.variableJump(jumpForces[_size]*1.1);
               });
            } else if (!invulnerable) {
               enemy.freeze(0.7);
               this.hurt();
            }
         },
         add() {
            k.onButtonPress('jump', ()=>{
               if (!this.isGrounded() || !alive || frozen) return;
               const anim = `${this.curAnim()?.startsWith('run') ? 'pjump' : 'jump'}-${_size}`;
               if (this.hasAnim(anim)) this.play(anim);
               k.play('jump');
               // Implement jump force based on momentum and run state
               let jumpForce = jumpForces[_size];
               if (k.isButtonDown('turbo') && momentum) jumpForce *= 1.1;
               if (runTime>=prunThreshold) jumpForce *= 1.1;
               this.variableJump(jumpForce);
            });
            this.onBeforePhysicsResolve(col=>{
               // There's only special logic for touching enemies
               if (col.target.is('enemy')) {
                  col.preventResolution();
                  this.handleCollideEnemy(col.target, col);
               }
            });
            this.onCollide('coin', (coin, col)=>{
               col.preventResolution();
               // TODO: Eventually add to player score
               coin.collect();
            });
            this.onUpdate(()=>{
               // Don't process if dead
               if (!alive) return;
               // Invulnerability
               if (invulnerable) {
                  this.opacity = k.wave(0.2, 0.8, k.time() * 75);
               } else if (this.opacity!==1) {
                  this.opacity = 1;
               }
               // Don't process movement if frozen
               if (frozen) return;
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
               const prunCount = Math.ceil(runTime*6 / prunThreshold);
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
               let anim = `${skidding ? 'skid' : prunning ? 'run' : moving ? 'walk' : 'idle'}-${_size}`;
               if (goDown && this.hasAnim(`duck-${_size}`)) anim = `duck-${_size}`;
               const animSpeed = momentum ? Math.abs(momentum)/maxSpeed * (goTurbo ? 3 : 1.2) : 1;
               // Actually apply calculations to the characters
               lastPos = this.pos.clone();
               if (this.animSpeed!==animSpeed) this.animSpeed = animSpeed;
               if (momentum) {
                  this.flipX = momentum>0;
                  this.move(momentum, 0);
                  if (this.isGrounded() && this.hasAnim(anim) && this.curAnim()!==anim) this.play(anim);
               } else if (this.isGrounded()) {
                  if (goUp && this.hasAnim(`lookup-${_size}`) && !_char.includes('raccoon')) this.play(`lookup-${_size}`);
                  else this.play(anim);
               } else if (this.isFalling()) {
                  this.play(`jump-${_size}`);
               }
               // Debug text display
               if (debugText) {
                  debugText.text = `Character: ${this.char} (${_size})\n`+
                     `Pos: ${this.pos.x.toFixed(0)}, ${this.pos.y.toFixed(0)} (Delta: ${lastPosDelta})\n`+
                     `Momentum: ${momentum}\n`+
                     `Run Time: ${runTime.toFixed(2)}s\n`+
                     `P-Meter: ${'>'.repeat(prunCount) + (prunning ? ' P' : '')}\n`+
                     `Skidding: ${skidding}\n`+
                     `Anim: ${this.curAnim()} (${this.animSpeed.toFixed(1)}x)`;
               }
            });
         },
      },
   ]);
}