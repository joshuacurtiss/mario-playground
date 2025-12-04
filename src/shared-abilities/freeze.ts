import { AreaComp, BodyComp, Comp, GameObj, SpriteComp } from "kaplay";
import k from "../kaplayCtx";

export interface FreezeComp extends Comp {
   get isFrozen(): boolean;
   set isFrozen(val: boolean);
   freeze(duration: number, options?: FreezeOpt): void;
}

interface FreezeOpt {
   onDone?: ()=>void;
}

export function freeze(): FreezeComp {
   let frozen = false;
   return {
      id: 'freeze',
      require: [ 'pos', 'area'],
      get isFrozen() {
         return frozen;
      },
      set isFrozen(val) {
         frozen = val;
      },
      freeze(this: GameObj<AreaComp & BodyComp & SpriteComp>, duration: number, options: FreezeOpt = {}): void {
         const { onDone } = options;
         if (frozen) return;
         const anim = this.curAnim();
         const shape = this.area.shape?.clone();
         const vel = this.vel.clone();
         this.isStatic = true;
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         this.vel = k.vec2(0, 0);
         this.stop();
         frozen = true;
         if (!duration) return;
         k.wait(duration, () => {
            this.isStatic = false;
            if (shape) this.area.shape = shape;
            this.vel = vel;
            if (anim) this.play(anim);
            frozen = false;
            if (onDone) onDone.call(this);
         });
      }
   };
}
