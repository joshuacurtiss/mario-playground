export function lives(initialLives=5) {
   let _lives = initialLives;
   return {
      id: 'lives',
      get lives() {
         return _lives;
      },
      set lives(val) {
         // Valid range: 0-99
         _lives = val>99 ? 99 : val<0 ? 0 : val;
         this.trigger('livesChanged', _lives);
      },
  };
}
