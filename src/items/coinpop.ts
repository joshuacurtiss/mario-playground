import k, { scale } from '../kaplayCtx';
import { BodyComp, Comp, GameObj, PosComp, ScaleComp, SpriteComp, Vec2, ZComp } from 'kaplay';
import type { CoinType } from './coin';
import { makeIndicator } from '../ui/indicator';
import { points, PointsComp } from '../shared-abilities/points';

// GameObj and its Factory Options

export type CoinPop = GameObj<SpriteComp & PosComp & BodyComp & PointsComp & ScaleComp & ZComp & CoinPopComp>;

export interface CoinPopOpt {
   type: CoinType;
   revealForce?: Vec2; // Initial velocity when revealed
   reveal?: boolean; // Whether to reveal immediately upon creation
   points?: number; // Points awarded when revealed
}

const optionDefaults: CoinPopOpt = {
   type: 'gold',
   revealForce: k.vec2(0, -1400),
   reveal: false,
   points: 100,
};

// Type guards

export function isCoinPop(obj?: GameObj): obj is CoinPop {
   return typeof obj !== 'undefined' && obj.has('coinpop');
}

// Component and its options

interface CoinPopComp extends Comp {
   collect: () => void;
   reveal: (pos?: Vec2) => void;
}

type CoinPopCompOpt = Omit<CoinPopOpt, 'points'>;
const { type, revealForce, reveal } = optionDefaults;
const compOptionDefaults: CoinPopCompOpt = { type, revealForce, reveal };

export function coinPop(options: Partial<CoinPopCompOpt> = {}): CoinPopComp {
   const { revealForce, reveal, type } = Object.assign({}, compOptionDefaults, options);
   return {
      id: 'coinpop',
      require: [ 'sprite', 'pos', 'body', 'points' ],
      add() {
         if (reveal) this.reveal();
      },
      collect() {
         // No-op for coinpop
      },
      reveal(this: CoinPop, pos = this.pos) {
         k.play('coin');
         this.pos = pos;
         this.z = 20;
         if (revealForce) this.vel = revealForce;
         this.isStatic = false;
         k.wait(0.54, ()=>{
            const exp = k.add([
               k.sprite('items', { anim: `coinexp-${type}` }),
               k.pos(this.pos),
               k.scale(this.scale),
               k.opacity(),
               k.lifespan(0.3),
               k.z(this.z),
            ]);
            if (this.points) {
               makeIndicator(this.pos.add(exp.width/2*exp.scale.x, 0), { msg: this.points.toFixed(0) });
            }
            this.destroy();
         });
      },
   };
}

export function makeCoinPop(pos: Vec2, options: Partial<CoinPopOpt> = {}): CoinPop {
   const opts = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: `coinpop-${opts.type}` }),
      k.pos(pos),
      k.body({ isStatic: true, gravityScale: 1.5 }),
      k.scale(scale),
      k.z(-1),
      points(opts.points),
      coinPop(options),
      'coinpop',
   ]);
}
