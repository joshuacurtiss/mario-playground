import { Comp } from 'kaplay';

export interface PointsComp extends Comp {
   get isOneUp(): boolean;
   get points(): number;
   set points(val: number);
}

export function points(points = 0, threshold1up = 10000): PointsComp {
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
