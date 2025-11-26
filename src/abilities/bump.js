import k from '../kaplayCtx';

export function bump(masterSpeed = k.vec2(0, -15)) {
   let bumping = false;
   let bumpMove; // The current movement vector during bump, changing per frame
   let thisBumpSpeed; // The speed of the current bump
   let origPos; // Original position before bump
   return {
      id: 'bump',
      require: [ 'sprite', 'pos', 'body' ],
      add() {
         origPos = this.pos.clone();
         this.onHeadbutted(obj=>{
            // Only respond to player headbutts
            if (!obj.is('player')) return;
            k.play('bump-block');
            // If it is an "empty" sprite, do not bump. We handle it this way because some things like
            // a note block or a brick can be bumped when empty. But a `block-empty` never will.
            if (this.curAnim().endsWith('empty')) return;
            const dir = obj.pos.x < this.pos.x + this.scale.x * this.width / 2 ? 1 : -1;
            this.bump(masterSpeed, dir, obj);
         });
      },
      bump(speed = masterSpeed, dir, bumper) {
         if (bumping) return; // Already bumping
         let { x, y } = speed;
         // Only single-axis bump, or equal on both axes
         if (Math.abs(x)!==Math.abs(y) & x!==0 && y!==0) {
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
      fixedUpdate() {
         if (bumping) {
            this.moveBy(bumpMove);
            ['x', 'y'].forEach(axis=>{
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
