import k, { scale } from '../../kaplayCtx';
import { Comp } from 'kaplay';
import { Char } from '../index';

export interface VariableJumpComp extends Comp {
   variableJump(force: number): void;
   endVariableJump(): void;
}

export default function variableJump(breakSpeed = 35*scale): VariableJumpComp {
   let jumping = false;
   return {
      variableJump(this: Char, force: number) {
         jumping = true;
         this.jump(force);
      },
      endVariableJump() {
         jumping = false;
      },
      add(this: Char) {
         this.onGround(() => {
            this.endVariableJump();
         });
      },
      fixedUpdate(this: Char) {
         // When they release the jump button, push the breaks on the upward velocity
         // until they hit the peak, then we let gravity take over as normal.
         if (jumping && !k.isButtonDown('jump') && this.vel.y < -breakSpeed) {
            this.vel.y += breakSpeed;
         }
      }
   };
}