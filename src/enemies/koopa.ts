import k, { scale } from "../kaplayCtx";
import { GameObj, Vec2 } from 'kaplay';
import { Enemy, EnemyComp, EnemyComps, isEnemy } from './index';
import { avoidCliff, AvoidCliffCompOpt } from './abilities/avoid-cliff';
import { collect } from "./abilities/collect";
import { move, MoveCompOpt } from "./abilities/move";
import { patrol, PatrolCompOpt } from "./abilities/patrol";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';

export const KOOPA_ENEMY_TAG = 'koopa';
export type Koopa = GameObj<EnemyComps & KoopaComp>;
export const KOOPA_TYPES = ['brn', 'red'] as const;
export type KoopaType = typeof KOOPA_TYPES[number];

export function isKoopaType(val: string): val is KoopaType {
   return KOOPA_TYPES.includes(val as any);
}

export function isKoopa(obj: GameObj): obj is Koopa {
   return isEnemy(obj) && obj.has(KOOPA_ENEMY_TAG);
}
export interface KoopaComp extends EnemyComp {
   get type(): KoopaType;
   set type(val: KoopaType);
   getSprite(): string;
   setSprite(newSprite: string): void;
   getType(): KoopaType;
}

function koopa(): KoopaComp {
   return {
      id: KOOPA_ENEMY_TAG,
      add(this: Koopa) {
         this.onHeadbutted(this.die);
         this.onCollide('die', () => this.destroy());
      },
      get type(): KoopaType {
         return this.getType();
      },
      set type(val: KoopaType) {
         const t = isKoopaType(val) ? val : KOOPA_TYPES[0];
         this.setSprite(`${KOOPA_ENEMY_TAG}-${t}`);
      },
      getType(this: Koopa): KoopaType {
         const t = this.getCurAnim()?.name.split('-')[1] ?? KOOPA_TYPES[0];
         if (isKoopaType(t)) return t;
         throw new Error(`Invalid koopa type: ${t}`);
      },
      getSprite(this: Enemy): string {
         return this.sprite;
      },
      setSprite(this: Koopa, newSprite: string) {
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
      squash(this: Koopa, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.play(`${KOOPA_ENEMY_TAG}-${this.type}-die`);
         k.play('stomp');
         this.trigger('die');
         this.freeze(0.5, { onDone: ()=>this.destroy() });
      },
      fixedUpdate(this: Koopa) {
         if (this.isFrozen) return;
         if (this.dir>0 !== this.flipX) this.flipX = !this.flipX;
      },
   };
}

export interface KoopaOpt {
   type: KoopaType;
   move?: MoveCompOpt;
   patrol?: PatrolCompOpt;
   avoidCliff?: Partial<AvoidCliffCompOpt>;
   points?: number;
}

const optionDefaults: KoopaOpt = {
   type: KOOPA_TYPES[0],
   move: { speed: 22 * scale },
   patrol: { radius: 1000 },
   points: 100,
};

export function makeKoopa(pos: Vec2, options = optionDefaults): Koopa {
   const opts = Object.assign({}, optionDefaults, options);
   const { type } = opts;
   return k.add([
      k.sprite('enemies', { anim: `${KOOPA_ENEMY_TAG}-${type}`, animSpeed: 0.75 }),
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
      koopa(),
      avoidCliff(opts.avoidCliff),
      'enemy',
      KOOPA_ENEMY_TAG,
   ]);
};
