import k from "../kaplayCtx";
import variableJump from "../abilities/variable-jump";

export function makePlayer(char='mario', pos=k.vec2(k.randi(50, k.width()-50), k.height()-96)) {
   const walkSpeed = 250;
   const runThreshold = 3;
   let runTime = 0;
   return k.add([
      k.sprite(char, { frame: 0 }),
      k.scale(4),
      k.area(),
      k.anchor('center'),
      k.pos(pos),
      k.body({ jumpForce: 1300 }),
      k.offscreen({ distance: 25 }),
      variableJump(),
      {
         add() {
            k.onButtonPress('jump', ()=>{
               // if (this.isGrounded()) k.play('jump', { volume: 0.5 });
               const anim = runTime>runThreshold ? 'run-jump' : 'jump';
               if (this.hasAnim(anim)) this.play(anim);
               this.variableJump();
            });
            k.onUpdate(()=>{
               const isMoving = k.isButtonDown('left') || k.isButtonDown('right');
               runTime = k.isButtonDown('turbo') && isMoving ? runTime + k.dt() : 0;
               const speed = runTime>runThreshold ? walkSpeed*2 : runTime ? walkSpeed*1.75 : walkSpeed;
               const anim = runTime>runThreshold ? 'run' : 'walk';
               if (k.isButtonDown('left')) {
                  this.flipX = false;
                  this.move(-speed, 0);
                  if (this.isGrounded() && this.hasAnim(anim) && this.curAnim()!==anim) this.play(anim);
               } else if (k.isButtonDown('right')) {
                  this.flipX = true;
                  this.move(speed, 0);
                  if (this.isGrounded() && this.hasAnim(anim) && this.curAnim()!==anim) this.play(anim);
               } else if (this.isGrounded()) {
                  this.frame = 0;
               }
            });
         },
      },
   ]);
}