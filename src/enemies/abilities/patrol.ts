import k from "../../kaplayCtx";

const optionDefaults = {
   pos: k.vec2(0, 0),
   radius: 500,
   boundaryLeft: null,
   boundaryRight: null,
};

export function patrol(options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   let { boundaryLeft, boundaryRight } = opts;
   if (!boundaryLeft && opts.radius) boundaryLeft = opts.pos.x - opts.radius;
   if (!boundaryRight && opts.radius) boundaryRight = opts.pos.x + opts.radius;
   if (boundaryLeft<0) boundaryLeft = 0;
   return {
      id: 'patrol',
      require: [ 'pos' ],
      fixedUpdate() {
         if (this.isFrozen) return;
         if (!this.isGrounded()) return;
         if (this.pos.x<boundaryLeft && this.dir<0) this.dir = 1;
         if (this.pos.x>boundaryRight && this.dir>0) this.dir = -1;
      }
   }
}
