import k from '../kaplayCtx';

export default function variableJump(jumpButton = 'jump', breakSpeed = 120) {
   let jumping = false;
   return {
      variableJump() {
         if (this.isGrounded()) {
            jumping = true;
            this.jump();
         }
      },
      endVariableJump() {
         jumping = false;
      },
      add() {
         this.onGround(() => {
            this.endVariableJump();
         });
      },
      update() {
         // When they release the jump button, push the breaks on the upward velocity
         // until they hit the peak, then we let gravity take over as normal.
         if (jumping && !k.isButtonDown(jumpButton) && this.vel.y < -breakSpeed) {
            this.vel.y += breakSpeed;
         }
      }
   };
}