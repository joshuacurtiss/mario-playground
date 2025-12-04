import { Comp } from "kaplay";
import { scale } from "../../kaplayCtx";
import { Enemy } from '../index';

type Dir = 1 | -1;

export interface MoveComp extends Comp {
   get dir(): Dir;
   set dir(val: Dir);
   get speed(): number;
   set speed(val: number);
}

export interface MoveCompOpt {
   speed?: number;
   dir?: Dir;
}

const optionDefaults: MoveCompOpt = {
   speed: 25 * scale,
   dir: 1,
};

export function move(options: Partial<MoveCompOpt> = {}): MoveComp {
   const opts = Object.assign({}, optionDefaults, options);
   let { dir: _dir, speed: _speed } = opts;
   return {
      id: 'move',
      require: [ 'pos', 'body' ],
      get dir() { return _dir ?? 1; },
      set dir(val) { _dir = val; },
      get speed() { return _speed ?? 0; },
      set speed(val) { _speed = val; },
      fixedUpdate(this: Enemy) {
         if (this.isFrozen) return;
         this.move(this.speed * this.dir, 0);
      },
      add(this: Enemy) {
         this.onBeforePhysicsResolve(col=>{
            if (this.isFrozen) return;
            // Ignore collision with other enemies when they fall on top of each other.
            if (col.target.is('enemy') && col.isBottom()) col.preventResolution();
         });
         this.onCollideUpdate((obj, col)=>{
            if (this.isFrozen || obj.is('player')) return;
            if ((col?.isLeft() && this.dir<0) || (col?.isRight() && this.dir>0)) {
               // If a block triggers a collision by just a few pixels vertically, ignore it.
               if (obj.is('block-or-brick') && Math.abs(obj.pos.y-this.pos.y) < 10) return;
               this.dir *= -1;
            }
         });
      }
   }
}
