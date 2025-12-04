import { Comp } from 'kaplay';
import { Char } from '../index';

export interface CoinsComp extends Comp {
   get coins(): number;
   set coins(val: number);
   setCoins(val: number): void;
   add(): void;
}

export function coins(initialCoins=0): CoinsComp {
   let _coins = initialCoins;
   return {
      id: 'coins',
      get coins() {
         return _coins;
      },
      set coins(val) {
         this.setCoins(val);
      },
      setCoins(this: Char, val: number) {
         _coins = val;
         if (_coins>99) {
            _coins -= 100;
            this.trigger('1up');
         }
         this.trigger('coinsChanged', _coins);
      },
      add(this: Char) {
         this.on('collect', (item)=>{
            if (!item.is('coin') && !item.is('coinpop')) return;
            this.coins += 1;
         });
      }
  };
}
