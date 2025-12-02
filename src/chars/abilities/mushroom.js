import k from '../../kaplayCtx';

export function mushroom() {
   return {
      id: 'mushroom',
      require: [ 'pos', 'freeze' ],
      add() {
         this.on('collect', (item) => {
            if (item.type !== 'mushroom') return false;
            this.grow();
         });
      },
      grow() {
         if (this.isFrozen) return;
         k.play('powerup');
         if (this.size==='lg') return;
         k.debug.log("Growing!");
         this.freeze(1, { onDone: ()=>{
            this.stop();
            this.vel = this.vel.scale(1.1);
            this.size = 'lg';
         }});
         this.play('grow', { speed: 20 });
      },
   };
}
