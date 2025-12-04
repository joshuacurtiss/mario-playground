export function coins(initialCoins=0) {
   let _coins = initialCoins;
   return {
      id: 'coins',
      get coins() {
         return _coins;
      },
      set coins(val) {
         _coins = val;
         if (_coins>99) {
            _coins -= 100;
            this.trigger('1up');
         }
         this.trigger('coinsChanged', _coins);
      },
      add() {
         this.on('collect', (item)=>{
            if (!item.is('coin') && !item.is('coinpop')) return;
            this.coins += 1;
         });
      }
  };
}
