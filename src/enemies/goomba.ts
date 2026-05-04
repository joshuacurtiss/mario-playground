import k, { scale } from "../kaplayCtx";
import { GameObj, Vec2 } from 'kaplay';
import { Enemy, EnemyComp, EnemyComps, isEnemy } from './index';
import { avoidCliff, AvoidCliffCompOpt } from './abilities/avoid-cliff';
import { collect } from "./abilities/collect";
import { move, MoveCompOpt } from "./abilities/move";
import { patrol, PatrolCompOpt } from "./abilities/patrol";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';

export const GOOMBA_ENEMY_TAG = 'goomba';
export type Goomba = GameObj<EnemyComps & GoombaComp>;
export const GOOMBA_TYPES = ['brn', 'red'] as const;
export type GoombaType = typeof GOOMBA_TYPES[number];

export function isGoombaType(val: string): val is GoombaType {
   return GOOMBA_TYPES.includes(val as any);
}

export function isGoomba(obj: GameObj): obj is Goomba {
   return isEnemy(obj) && obj.has(GOOMBA_ENEMY_TAG);
}
export interface GoombaComp extends EnemyComp {
   get type(): GoombaType;
   set type(val: GoombaType);
   getSprite(): string;
   setSprite(newSprite: string): void;
   getType(): GoombaType;
}

function goomba(): GoombaComp {
   return {
      id: GOOMBA_ENEMY_TAG,
      add(this: Goomba) {
         this.onHeadbutted(this.die);
         this.onCollide('die', () => this.destroy());
      },
      get type(): GoombaType {
         return this.getType();
      },
      set type(val: GoombaType) {
         const t = isGoombaType(val) ? val : GOOMBA_TYPES[0];
         this.setSprite(`${GOOMBA_ENEMY_TAG}-${t}`);
      },
      getType(this: Goomba): GoombaType {
         const t = this.getCurAnim()?.name.split('-')[1] ?? GOOMBA_TYPES[0];
         if (isGoombaType(t)) return t;
         throw new Error(`Invalid goomba type: ${t}`);
      },
      getSprite(this: Enemy): string {
         return this.sprite;
      },
      setSprite(this: Goomba, newSprite: string) {
         if (this.sprite === newSprite) return;
         const { flipX, frame } = this;
         this.use(k.sprite(newSprite, { frame, flipX }));
      },
      die(this: Enemy, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.isFrozen = true;
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         this.vel = k.vec2(0, -200*scale);
         this.flipY = true;
         this.stop();
         k.play('hit');
         this.trigger('die');
         k.wait(3, () => this.destroy());
      },
      stomp(this: Goomba, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.play(`${GOOMBA_ENEMY_TAG}-${this.type}-die`);
         k.play('stomp');
         this.trigger('die');
         this.freeze(0.5, { onDone: ()=>this.destroy() });
      }
   };
}

export interface GoombaOpt {
   type: GoombaType;
   move?: MoveCompOpt;
   patrol?: PatrolCompOpt;
   avoidCliff?: Partial<AvoidCliffCompOpt>;
   points?: number;
}

const optionDefaults: GoombaOpt = {
   type: GOOMBA_TYPES[0],
   move: { speed: 25 * scale },
   patrol: { radius: 1000 },
   points: 100,
};

export function makeGoomba(pos: Vec2, options = optionDefaults): Goomba {
   const opts = Object.assign({}, optionDefaults, options);
   const { type } = opts;
   return k.add([
      k.sprite('enemies', { anim: `${GOOMBA_ENEMY_TAG}-${type}` }),
      k.scale(0.975 * scale),
      k.area({
         shape: new k.Rect(k.vec2(0, -1), 14, 15),
         collisionIgnore: [ 'coin' ],
      }),
      k.anchor('bot'),
      k.pos(pos),
      k.body({ maxVelocity: 1200 }),
      k.z(1),
      k.offscreen({ distance: 10000, destroy: true }),
      collect(),
      move(opts.move),
      patrol({ pos, ...opts.patrol }),
      points(opts.points),
      freeze(),
      goomba(),
      avoidCliff(opts.avoidCliff),
      'enemy',
      GOOMBA_ENEMY_TAG,
   ]);
};
