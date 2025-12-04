import k from '../../kaplayCtx';
import { Comp } from 'kaplay';
import { Char } from '../index';
import { makeIndicator } from '../../ui/indicator';
import { isRect } from '../../lib/type-guards';

export interface LivesComp extends Comp {
   get lives(): number;
   set lives(val: number);
   setLives(val: number): void;
   oneUp(): void;
}

export function lives(initialLives=5): LivesComp {
   let _lives = initialLives;
   return {
      id: 'lives',
      require: [ 'pos', 'area' ],
      get lives() {
         return _lives;
      },
      set lives(val) {
         this.setLives(val);
      },
      setLives(this: Char, val: number) {
         // Valid range: 0-99
         _lives = val>99 ? 99 : val<0 ? 0 : val;
         this.trigger('livesChanged', _lives);
      },
      oneUp(this: Char) {
         this.lives += 1;
         k.play('1up');
         const shape = this.area.shape && isRect(this.area.shape) ? this.area.shape : new k.Rect(k.vec2(0,0),0,0);
         makeIndicator(this.pos.sub(0, shape.height*this.scale.y-shape.pos.y*this.scale.y), { sprite: 'ui-1up' });
      },
      add(this: Char) {
         this.on('1up', this.oneUp);
         this.on('collect', (item)=>{
            if (item.type !== '1up') return;
            this.oneUp();
         });
      },
  };
}
