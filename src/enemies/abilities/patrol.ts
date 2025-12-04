import k from "../../kaplayCtx";
import { Enemy } from '../index'
import { Comp, Vec2 } from 'kaplay';

interface Boundary {
   left: number;
   right: number;
}

export interface PatrolComp extends Comp {
   get isPatrolling(): boolean;
}

export interface PatrolCompOpt {
   pos?: Vec2;
   radius?: number;
   boundary?: Boundary;
}

const optionDefaults: PatrolCompOpt = {
   pos: k.vec2(0, 0),
   radius: 500,
};

export function patrol(options: PatrolCompOpt = {}): PatrolComp {
   const opts = Object.assign({}, optionDefaults, options);
   let { boundary } = opts;
   if (!boundary && opts.radius && opts.pos) boundary = {
      left: opts.pos.x - opts.radius,
      right: opts.pos.x + opts.radius,
   };
   if (boundary && boundary.left < 0) boundary.left = 0;
   return {
      id: 'patrol',
      require: [ 'pos', 'freeze' ],
      get isPatrolling() {
         return !!boundary;
      },
      fixedUpdate(this: Enemy) {
         if (this.isFrozen) return;
         if (!this.isGrounded()) return;
         if (!this.pos) return;
         if (!boundary) return;
         if (this.pos.x < boundary.left && this.dir < 0) this.dir = 1;
         if (this.pos.x > boundary.right && this.dir > 0) this.dir = -1;
      }
   }
}
