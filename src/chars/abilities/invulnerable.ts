import k from '../../kaplayCtx';

const invulnerableOptionDefaults = {
   onDone: null,
};

export function invulnerable() {
   let invulnerable = false;
   return {
      id: 'invulnerable',
      requires: [ 'opacity' ],
      get isInvulnerable() {
         return invulnerable;
      },
      set isInvulnerable(val) {
         invulnerable = val;
      },
      invulnerable(duration, options = invulnerableOptionDefaults) {
         const { onDone } = Object.assign({}, invulnerableOptionDefaults, options);
         invulnerable = true;
         if (!duration) return;
         k.wait(duration, () => {
            invulnerable = false;
            if (onDone) onDone.call(this);
         });
      },
      fixedUpdate() {
         if (invulnerable) {
            this.opacity = k.wave(0.2, 0.8, k.time() * 75);
         } else if (this.opacity!==1 && this.opacity>0) {
            this.opacity = 1;
         }
      }
   };
}
