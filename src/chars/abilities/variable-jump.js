import k, { scale } from '../../kaplayCtx';

export default function variableJump(jumpButton = 'jump', breakSpeed = 35*scale) {
   let jumping = false;
   return {
      variableJump(force) {
         jumping = true;
         this.jump(force);
      },
      endVariableJump() {
         jumping = false;
      },
      add() {
         this.onGround(() => {
            this.endVariableJump();
         });
      },
      fixedUpdate() {
         // When they release the jump button, push the breaks on the upward velocity
         // until they hit the peak, then we let gravity take over as normal.
         if (jumping && !k.isButtonDown(jumpButton) && this.vel.y < -breakSpeed) {
            this.vel.y += breakSpeed;
         }
      }
   };
}