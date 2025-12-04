import k from '../../kaplayCtx';
import { Comp } from 'kaplay';
import { Char } from '../index';

export interface InvulnerableOpt {
   onDone?: Function;
}

const invulnerableOptionDefaults: InvulnerableOpt = {};

export interface InvulnerableComp extends Comp {
   invulnerable(duration: number, options?: InvulnerableOpt): void;
   get isInvulnerable(): boolean;
   set isInvulnerable(val: boolean);
}

export function invulnerable(): InvulnerableComp {
   let invulnerable = false;
   return {
      id: 'invulnerable',
      require: [ 'opacity' ],
      get isInvulnerable() {
         return invulnerable;
      },
      set isInvulnerable(val) {
         invulnerable = val;
      },
      invulnerable(duration, options: Partial<InvulnerableOpt> = {}) {
         const { onDone } = Object.assign({}, invulnerableOptionDefaults, options);
         invulnerable = true;
         if (!duration) return;
         k.wait(duration, () => {
            invulnerable = false;
            if (onDone) onDone.call(this);
         });
      },
      fixedUpdate(this: Char) {
         if (invulnerable) {
            this.opacity = k.wave(0.2, 0.8, k.time() * 75);
         } else if (this.opacity!==1 && this.opacity>0) {
            this.opacity = 1;
         }
      }
   };
}
