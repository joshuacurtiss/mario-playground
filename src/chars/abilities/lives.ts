import k from '../../kaplayCtx';
import { makeIndicator } from '../../ui/indicator';

export function lives(initialLives=5) {
   let _lives = initialLives;
   return {
      id: 'lives',
      require: [ 'pos', 'area' ],
      get lives() {
         return _lives;
      },
      set lives(val) {
         // Valid range: 0-99
         _lives = val>99 ? 99 : val<0 ? 0 : val;
         this.trigger('livesChanged', _lives);
      },
      oneUp() {
         this.lives += 1;
         k.play('1up');
         makeIndicator(this.pos.sub(0, this.area.shape.height*this.scale.y-this.area.shape.pos.y*this.scale.y), { sprite: 'ui-1up' });
      },
      add() {
         this.on('1up', this.oneUp);
         this.on('collect', (item)=>{
            if (item.type !== '1up') return;
            this.oneUp();
         });
      },
  };
}
