import k from '../../kaplayCtx';
import { Comp } from 'kaplay';
import { Char } from '../index';

export interface MushroomComp extends Comp {
   grow(): void;
}

export function mushroom(): MushroomComp {
   return {
      id: 'mushroom',
      require: [ 'body', 'pos', 'freeze' ],
      add(this: Char) {
         this.on('collect', (item) => {
            if (item.type !== 'mushroom') return false;
            this.grow();
         });
      },
      grow(this: Char) {
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
