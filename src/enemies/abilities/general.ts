import { Comp } from 'kaplay';
import { Enemy } from '../';

export interface GeneralComp extends Comp {
   setAnim(anim: string, stop?: boolean): void;
}

export function general(): GeneralComp {
   return {
      id: 'general',
      require: [ 'sprite' ],
      setAnim(this: Enemy, anim: string, stop = false) {
         if (this.getCurAnim()?.name === anim) return;
         if (!this.hasAnim(anim)) {
            console.warn(`Enemy is missing anim: ${anim}`);
            return;
         }
         this.play(anim);
         if (stop) this.stop();
      },
   };
}
