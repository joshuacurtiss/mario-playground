import k from '../../kaplayCtx';
import { Comp, GameObj, Vec2 } from 'kaplay';
import { HeadbuttableComps } from '../index';
import { Char, isChar } from '../../chars';

type Dir = 1 | -1;

export interface BumpComp extends Comp {
   bump: (speed?: Vec2, dir?: Dir, bumper?: Char) => void;
}

export type HeadbuttableWithBump = GameObj<HeadbuttableComps & BumpComp>;

export function bump(masterSpeed = k.vec2(0, -15)): BumpComp {
   let bumping = false;
   let bumpMove: Vec2; // The current movement vector during bump, changing per frame
   let thisBumpSpeed: Vec2; // The speed of the current bump
   let origPos: Vec2; // Original position before bump
   return {
      id: 'bump',
      require: [ 'sprite', 'pos', 'body' ],
      add(this: HeadbuttableWithBump) {
         origPos = this.pos.clone();
         this.onHeadbutted(obj=>{
            // Only respond to player headbutts
            if (!isChar(obj)) return;
            k.play('bump-block');
            // If it is an "empty" sprite, do not bump. We handle it this way because some things like
            // a note block or a brick can be bumped when empty. But a `block-empty` never will.
            if (this.curAnim()?.endsWith('empty')) return;
            const dir = obj.pos.x < this.pos.x + this.scale.x * this.width / 2 ? 1 : -1;
            this.bump(masterSpeed, dir, obj);
         });
      },
      bump(this: HeadbuttableWithBump, speed = masterSpeed, dir, bumper) {
         if (bumping) return; // Already bumping
         let { x, y } = speed;
         // Only single-axis bump, or equal on both axes
         if (Math.abs(x)!==Math.abs(y) && x!==0 && y!==0) {
            const max = Math.max(Math.abs(x), Math.abs(y));
            x = max * (x<0 ? -1 : 1);
            y = max * (y<0 ? -1 : 1);
         }
         thisBumpSpeed = k.vec2(x, y);
         bumpMove = thisBumpSpeed.clone();
         bumping = true;
         this.trigger('bump', dir, bumper);
         // If we detect an object on top, it gets a bump
         this.getCollisions().forEach(col=>{
            if (col.normal.y && col.target.is(['powerup', 'player', 'coin', 'enemy'], 'or')) {
               if (col.target.has('body')) col.target.applyImpulse(thisBumpSpeed.scale(60));
               col.target.trigger('headbutted', bumper);
            }
         });
      },
      fixedUpdate(this: HeadbuttableWithBump) {
         if (bumping) {
            this.moveBy(bumpMove);
            (['x', 'y'] as const).forEach(axis=>{
               if (thisBumpSpeed[axis]) bumpMove[axis] += thisBumpSpeed[axis] > 0 ? -3 : 3;
            });
            // Check if we are back to original position. Consider the bump done.
            if (this.pos.dist(origPos) < 1) {
               this.pos = origPos.clone();
               this.trigger('bumpDone');
               bumping = false;
            }
         }
      },
  };
}
