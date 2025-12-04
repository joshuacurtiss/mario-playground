import k from "../kaplayCtx";

const freezeOptionDefaults = {
   onDone: null,
};

export function freeze() {
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
      freeze(duration, options = freezeOptionDefaults) {
         const { onDone } = Object.assign({}, freezeOptionDefaults, options);
         if (frozen) return;
         const anim = this.curAnim();
         const shape = this.area.shape.clone();
         const vel = this.vel.clone();
         this.isStatic = true;
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         this.vel = k.vec2(0, 0);
         this.stop();
         frozen = true;
         if (!duration) return;
         k.wait(duration, () => {
            this.isStatic = false;
            this.area.shape = shape;
            this.vel = vel;
            if (anim) this.play(anim);
            frozen = false;
            if (onDone) onDone.call(this);
         });
      }
   };
}
