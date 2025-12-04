export function score(initialScore=0) {
   let _score = initialScore;
   return {
      id: 'score',
      get score() {
         return _score;
      },
      set score(val) {
         _score = val;
         this.trigger('scoreChanged', _score);
      },
  };
}
