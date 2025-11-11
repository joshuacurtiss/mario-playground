export function points(points = 0) {
   let _points = points;
   return {
      id: 'points',
      require: [ 'sprite', 'pos' ],
      get points() {
         return _points;
      },
      set points(val) {
         _points = val;
      },
  };
}
