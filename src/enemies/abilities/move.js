import { scale } from "../../kaplayCtx";

const optionDefaults = {
   speed: 25 * scale,
   dir: 1,
};

export function move(options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   let { dir: _dir, speed: _speed } = opts;
   return {
      id: 'move',
      require: [ 'pos', 'body' ],
      get dir() { return _dir; },
      set dir(val) { _dir = val; },
      get speed() { return _speed; },
      set speed(val) { _speed = val; },
      fixedUpdate() {
         if (this.isFrozen) return;
         this.move(this.speed * this.dir, 0);
      },
      add() {
         this.onBeforePhysicsResolve(col=>{
            if (this.isFrozen) return;
            // Ignore collision with other enemies when they fall on top of each other.
            if (col.target.is('enemy') && col.isBottom()) col.preventResolution();
         });
         this.onCollideUpdate((obj, col)=>{
            if (this.isFrozen || obj.is('player')) return;
            if ((col.isLeft() && this.dir<0) || (col.isRight() && this.dir>0)) {
               // If a block triggers a collision by just a few pixels vertically, ignore it.
               if (obj.is('block-or-brick') && Math.abs(obj.pos.y-this.pos.y) < 10) return;
               this.dir *= -1;
            }
         });
      }
   }
}
