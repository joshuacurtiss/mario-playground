import k from '../kaplayCtx';
import { makeIndicator } from '../ui/indicator';
import { points } from '../abilities/points';

const optionDefaults = {
   type: 'gold', // 'gold' or 'blue'
   revealForce: k.vec2(0, -1400), // Initial velocity when revealed
   reveal: false, // Whether to reveal immediately upon creation
   points: 100, // Points awarded when revealed
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
      points(opts.points),
      'coinpop',
      {
         add() {
            if (reveal) this.reveal();
         },
         collect() {
            // No-op for coinpop
         },
         reveal(pos = this.pos) {
            k.play('coin');
            this.pos = pos;
            this.vel = revealForce;
            this.isStatic = false;
            k.wait(0.54, ()=>{
               const exp = k.add([
                  k.sprite('items', { anim: `coinexp-${type}` }),
                  k.pos(this.pos),
                  k.scale(this.scale),
                  k.opacity(),
                  k.lifespan(0.3),
                  k.z(this.z),
               ]);
               makeIndicator(this.pos.add(exp.width/2*exp.scale.x, 0), opts.points);
               k.destroy(this);
            });
         },
      }
   ]);
}
