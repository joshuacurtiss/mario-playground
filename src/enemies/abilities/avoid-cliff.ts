import k, { scale } from "../../kaplayCtx";
import { Comp, GameObj, Vec2 } from 'kaplay';
import { Enemy } from '../index';
import { isGameObjWithOpacity } from "../../lib/type-guards";

export interface AvoidCliffComp extends Comp {
   get groundTag(): string | string[];
   set groundTag(val: string | string[]);
   get margin(): number;
   set margin(val: number);
   get rayOffsetY(): number;
   set rayOffsetY(val: number);
   get rayDepth(): number;
   set rayDepth(val: number);
   get enabled(): boolean;
   set enabled(val: boolean);
}

export interface AvoidCliffCompOpt {
   enabled: boolean;
   margin: number;
   rayOffsetY: number;
   rayDepth: number;
   groundTag: string | string[];
}

const optionDefaults: AvoidCliffCompOpt = {
   enabled: true,
   margin: 3,
   rayOffsetY: 2,
   rayDepth: 8,
   groundTag: ['immovable', 'ground', 'walkthru'],
};

function isGround(obj?: GameObj, groundTag?: string | string[]): boolean {
   if (!obj) return false;
   const isGroundTag = Array.isArray(groundTag) ? groundTag.some(t => obj?.is(t)) : obj?.is(groundTag ?? '');
   const isVisible = isGameObjWithOpacity(obj) ? obj.opacity > 0 : true;
   return isGroundTag && isVisible;
}

export function avoidCliff(options: Partial<AvoidCliffCompOpt> = {}): AvoidCliffComp {
   let { enabled, margin, rayOffsetY, rayDepth, groundTag } = Object.assign({}, optionDefaults, options);
   return {
      id: 'avoid-cliff',
      require: [ 'area', 'body', 'sprite', 'move' ],
      get groundTag() { return groundTag; },
      set groundTag(val: string | string[]) { groundTag = val; },
      get margin() { return margin; },
      set margin(val: number) { margin = val; },
      get rayOffsetY() { return rayOffsetY; },
      set rayOffsetY(val: number) { rayOffsetY = val; },
      get rayDepth() { return rayDepth; },
      set rayDepth(val: number) { rayDepth = val; },
      get enabled() { return enabled; },
      set enabled(val: boolean) { enabled = val; },
      fixedUpdate(this: Enemy) {
         if (!enabled) return;
         if (this.isFrozen) return;
         const area = this.worldArea();
         const xs = area.pts.map((p: Vec2) => p.x);
         const ys = area.pts.map((p: Vec2) => p.y);
         const bottomY = Math.max(...ys);
         const xEdge = this.dir > 0 ? Math.max(...xs) : Math.min(...xs);

         // Cast from just above the leading foot edge downward to detect a cliff.
         const hitEdge = k.raycast(k.vec2(xEdge, bottomY-rayOffsetY*scale), k.vec2(0, rayDepth*scale));
         const hitMargin = k.raycast(k.vec2(xEdge-margin*scale*this.dir, bottomY-rayOffsetY*scale), k.vec2(0, rayDepth*scale));
         // If both rays miss, or if they hit but not the ground, turn around.
         if ((!hitMargin && !hitEdge) || (!isGround(hitMargin?.object, groundTag) && !isGround(hitEdge?.object, groundTag))) {
            this.flipX = !this.flipX;
            this.dir = this.flipX ? -1 : 1;
         }
      }
   };
}
