export function coins(initialCoins=0) {
   let _coins = initialCoins;
   return {
      id: 'coins',
      require: [ 'sprite', 'pos' ],
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
  };
}
