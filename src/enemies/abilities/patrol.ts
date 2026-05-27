import k from "../../kaplayCtx";
import { EnemyComps } from '../index'
import { Comp, GameObj, Vec2 } from 'kaplay';
import { MoveComp } from "./move";

interface Boundary {
   left: number;
   right: number;
}

export interface PatrolComp extends Comp {
   get isPatrolling(): boolean;
   get enablePatrolling(): boolean;
   set enablePatrolling(newVal: boolean);
}

export interface PatrolCompOpt {
   pos?: Vec2;
   radius?: number;
   boundary?: Boundary;
   enabled?: boolean;
}

const optionDefaults: PatrolCompOpt = {
   pos: k.vec2(0, 0),
   radius: 500,
   enabled: true,
};

export function patrol(options: PatrolCompOpt = {}): PatrolComp {
   const opts = Object.assign({}, optionDefaults, options);
   let { boundary, enabled } = opts;
   if (!boundary && opts.radius && opts.pos) boundary = {
      left: opts.pos.x - opts.radius,
      right: opts.pos.x + opts.radius,
   };
   if (boundary && boundary.left < 0) boundary.left = 0;
   return {
      id: 'patrol',
      require: [ 'pos', 'freeze', 'move' ],
      get isPatrolling() {
         return !!boundary && !!enabled;
      },
      get enablePatrolling(): boolean {
         return enabled ?? false;
      },
      set enablePatrolling(newVal: boolean) {
         enabled = newVal;
      },
      fixedUpdate(this: GameObj<EnemyComps & PatrolComp & MoveComp>) {
         if (this.isFrozen) return;
         if (!this.isGrounded()) return;
         if (!this.pos) return;
         if (!boundary) return;
         if (!enabled) return;
         if (this.pos.x < boundary.left && this.dir < 0) this.dir = 1;
         if (this.pos.x > boundary.right && this.dir > 0) this.dir = -1;
      }
   }
}
