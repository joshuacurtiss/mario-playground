import { Comp } from 'kaplay';
import { Char } from '../index';

export interface ScoreComp extends Comp {
   get score(): number;
   set score(val: number);
   setScore(val: number): void;
}

export function score(initialScore=0): ScoreComp {
   let _score = initialScore;
   return {
      id: 'score',
      get score() {
         return _score;
      },
      set score(val) {
         this.setScore(val);
      },
      setScore(this: Char, val: number) {
         _score = val;
         this.trigger('scoreChanged', _score);
      },
  };
}
