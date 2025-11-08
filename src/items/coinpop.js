import k from '../kaplayCtx';

const optionDefaults = {
   type: 'gold', // 'gold' or 'blue'
   revealForce: k.vec2(0, -1400), // Initial velocity when revealed
   reveal: false, // Whether to reveal immediately upon creation
};

export function makeCoinPop(pos, options = {}) {
   const opts = Object.assign({}, optionDefaults, options);
   const { revealForce, reveal } = opts;
   // If you provide a type without coinpop anim, default to gold
   let { type } = opts;
   const spriteComp = k.sprite('items');
   if (!spriteComp.hasAnim(`coinpop-${type}`)) type = 'gold';
   spriteComp.play(`coinpop-${type}`);
   return k.add([
      spriteComp,
      k.pos(pos),
      k.body({ isStatic: true, gravityScale: 1.5 }),
      k.scale(4),
      'coinpop',
      {
         add() {
            if (reveal) this.reveal();
         },
         reveal(pos = this.pos) {
            k.play('coin');
            this.pos = pos;
            this.vel = revealForce;
            this.isStatic = false;
            k.wait(0.54, ()=>{
               k.add([
                  k.sprite('items', { anim: `coinexp-${type}` }),
                  k.pos(this.pos),
                  k.scale(this.scale),
                  k.opacity(),
                  k.lifespan(0.3),
                  k.z(this.z),
               ]);
               k.destroy(this);
            });
         },
      }
   ]);
}
