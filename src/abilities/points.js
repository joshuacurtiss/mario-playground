export function points(points = 0, threshold1up = 10000) {
   let _points = points;
   return {
      id: 'points',
      get isOneUp() {
         return _points > threshold1up;
      },
      get points() {
         return this.isOneUp ? 0 : _points;
      },
      set points(val) {
         _points = val;
      },
  };
}
