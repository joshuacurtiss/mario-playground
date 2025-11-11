export function points(points = 0) {
   let _points = points;
   return {
      id: 'points',
      get points() {
         return _points;
      },
      set points(val) {
         _points = val;
      },
  };
}
