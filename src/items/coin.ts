import k, { scale } from '../kaplayCtx';
import { AreaComp, BodyComp, BodyCompOpt, Collision, Comp, GameObj, OffScreenComp, OpacityComp, PosComp, ScaleComp, SpriteComp, Vec2 } from 'kaplay';
import { makeCoinPop } from './coinpop'
import { points, PointsComp } from '../shared-abilities/points';

// Shared configurations
const collisionIgnore = [ 'coin', 'enemy' ];
const makeCoinAreaShape = () => new k.Rect(k.vec2(3, 0), 10, 16);

// "Coin" and "CoinWithBody" types and their comp lists
export type CoinType = 'gold' | 'blue';
export type CoinComps = SpriteComp & PosComp & AreaComp & ScaleComp & OpacityComp & OffScreenComp & PointsComp & CoinComp;
export type CoinWithBodyComps = CoinComps & BodyComp & CoinWithBodyComp;
export type Coin = GameObj<CoinComps>;
export type CoinWithBody = GameObj<CoinWithBodyComps>;

/*
 * "Coin" and "CoinWithBody" factory options and defaults
 */

// Factory option interfaces
export interface CoinOpt {
   type: CoinType;
   points?: number;
}
export interface CoinWithBodyOpt extends CoinOpt {
   velocity?: Vec2;
   expire?: number;
   body?: BodyCompOpt;
}

// Factory option defaults
const bodyOptionDefaults: BodyCompOpt = {
   gravityScale: 0.75,
   drag: 0.75,
   maxVelocity: 1800,
};
const coinOptionDefaults: CoinOpt = {
   type: 'gold',
   points: 50,
};
const coinWithBodyOptionDefaults: CoinWithBodyOpt = {
   ...coinOptionDefaults,
   velocity: k.vec2(0, 0),
   body: { ...bodyOptionDefaults },
};

/*
 * The actual "Coin" and "CoinWithBody" components
 */

// "Coin" component
export interface CoinComp extends Comp {
   collect(): void;
}
function coin(): CoinComp {
   return {
      id: 'coin',
      collect(this: Coin) {
         k.play('coin');
         this.destroy();
      },
   };
}

// "CoinWithBody" component (and its options)
export interface CoinWithBodyComp extends Comp {
   get isExpiringSoon(): boolean;
}
export type CoinWithBodyCompOpt = Omit<CoinWithBodyOpt, 'points' | 'body'>;
const { expire, type, velocity } = coinWithBodyOptionDefaults;
const coinWithBodyCompOptionDefaults: CoinWithBodyCompOpt = { expire, type, velocity };

function coinBody(options: Partial<CoinWithBodyCompOpt> = {}): CoinWithBodyComp {
   const opts = Object.assign({}, coinWithBodyCompOptionDefaults, options);
   const expireTime = k.time() + (opts.expire ?? 0);
   const expireSoonSecs = 2;
   return {
      id: 'coin-body',
      get isExpiringSoon() {
         if (!opts.expire) return false;
         return k.time() >= expireTime-expireSoonSecs;
      },
      fixedUpdate(this: CoinWithBody) {
         if (!opts.expire) return;
         if (this.isExpiringSoon) this.opacity = k.wave(0.2, 0.8, k.time()*75);
         if (k.time() >= expireTime) this.destroy();
      },
      add(this: CoinWithBody) {
         // Handle headbutting
         this.onHeadbutted(player=>{
            if (player) player.trigger('collect', this);
            makeCoinPop(this.pos, { type, reveal: true });
         });
         // If it hits ground or block, it should bounce
         const bounce = (_: GameObj, col?: Collision) => {
            if (!this.has('body')) return;
            if (col?.normal.x) this.vel = this.vel.scale(-0.85, 1);
            if (col?.normal.y) this.vel = this.vel.scale(1, col.normal.y<0 ? -0.75 : 1);
         };
         ['ground', 'block-or-brick'].forEach(tag=>this.onCollide(tag, bounce));
         // Initial velocity
         if (velocity) this.vel = velocity;
      }
   };
}

// "Coin" and "CoinWithBody" factory functions

export function makeCoin(pos: Vec2, options: Partial<CoinOpt> = {}): Coin {
   const opts = Object.assign({}, coinOptionDefaults, options);
   const { type } = opts;
   return k.add([
      k.sprite('items', { anim: `coin-${type}` }),
      k.pos(pos),
      k.area({ shape: makeCoinAreaShape(), collisionIgnore }),
      k.scale(scale),
      k.opacity(1),
      k.offscreen({ pause: true, unpause: true }),
      points(opts.points),
      coin(),
      'coin',
   ]);
}

export function makeCoinWithBody(pos: Vec2, options: Partial<CoinWithBodyOpt> = {}): CoinWithBody {
   const bodyOptions = Object.assign({}, bodyOptionDefaults, options.body ?? {})
   const opts = Object.assign({}, coinWithBodyOptionDefaults, options);
   const { type, velocity, expire } = opts;
   return k.add([
      k.sprite('items', { anim: `coin-${type}` }),
      k.pos(pos),
      k.area({ shape: makeCoinAreaShape(), collisionIgnore }),
      k.scale(scale),
      k.opacity(1),
      k.offscreen({ pause: true, unpause: true }),
      points(opts.points),
      coin(),
      k.body(bodyOptions),
      coinBody({ type, velocity, expire }),
      'coin',
      'coin-with-body',
   ]);
}
