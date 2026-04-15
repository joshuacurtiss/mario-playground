import k from '../../kaplayCtx';
import { AudioPlay, Comp } from 'kaplay';
import { Char } from '../index';

export interface StarOpt {
   time: number;
}

const optionDefaults: StarOpt = {
   time: 9,
};

export interface StarComp extends Comp {
   cancelStarPower(): void;
   get hasStarPower(): boolean;
}

export function star(options: Partial<StarOpt> = {}): StarComp {
   const { time } = Object.assign({}, optionDefaults, options);
   let starPower = false;
   let music: AudioPlay;
   return {
      id: 'star',
      require: [ 'pos', 'freeze', 'flash' ],
      add(this: Char) {
         this.on('die', this.cancelStarPower);
         this.on('collect', (item) => {
            if (item.type !== 'star') return false;
            this.cancelStarPower();
            starPower = true;
            music = k.play('invincible');
            this.trigger('starPowerChanged', starPower);
            this.flash(time, { onDone: ()=>{
               starPower = false;
               this.trigger('starPowerChanged', starPower);
            }});
         });
      },
      cancelStarPower(this: Char) {
         starPower = false;
         this.cancelFlash();
         music?.stop();
      },
      get hasStarPower() {
         return starPower;
      },
   };
}
