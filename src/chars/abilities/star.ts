import { Comp } from 'kaplay';
import { Char } from '../index';

export interface StarOpt {
   time: number;
}

const optionDefaults: StarOpt = {
   time: 8,
};

export interface StarComp extends Comp {
   get hasStarPower(): boolean;
}

export function star(options: Partial<StarOpt> = {}): StarComp {
   const { time } = Object.assign({}, optionDefaults, options);
   let starPower = false;
   return {
      id: 'star',
      require: [ 'pos', 'freeze', 'flash' ],
      add(this: Char) {
         this.on('collect', (item) => {
            if (item.type !== 'star') return false;
            starPower = true;
            this.trigger('starPowerChanged', starPower);
            this.flash(time, { onDone: ()=>{
               starPower = false;
               this.trigger('starPowerChanged', starPower);
            }});
         });
      },
      get hasStarPower() {
         return starPower;
      },
   };
}
