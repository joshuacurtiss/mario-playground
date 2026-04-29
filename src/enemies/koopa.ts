import k, { scale } from "../kaplayCtx";
import { GameObj, Vec2 } from 'kaplay';
import { EnemyComp, EnemyComps, isEnemy } from './index';
import { avoidCliff, AvoidCliffComp, AvoidCliffCompOpt } from './abilities/avoid-cliff';
import { collect } from "./abilities/collect";
import { general } from "./abilities/general";
import { move, MoveComp, MoveCompOpt, Dir } from "./abilities/move";
import { patrol, PatrolComp, PatrolCompOpt } from "./abilities/patrol";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';
import { Char, isChar } from "../chars";
import { isHeadbuttable } from '../items';

export const KOOPA_ENEMY_TAG = 'koopa';

export const KOOPA_STATE = {
   DEAD: 0,
   SHELL: 1,
   WALK: 2,
   FLY: 3,
} as const;
export type KoopaState = typeof KOOPA_STATE[keyof typeof KOOPA_STATE];
export type Koopa = GameObj<EnemyComps & KoopaComp & AvoidCliffComp & MoveComp & PatrolComp>;
export const KOOPA_TYPES = ['grn', 'red'] as const;
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
   get state(): KoopaState;
   set state(val: KoopaState);
   setState(newState: KoopaState): void;
   getType(): KoopaType;
   setType(val: KoopaType): void;
}

function koopa(): KoopaComp {
   let _state: KoopaState = KOOPA_STATE.WALK;
   let actingPlayer: Char;
   let hitCount = 0;
   let origSpeed = 0;
   let origDir: Dir = 0;
   let origAvoidCliff = false;
   let origPatrolling = false;
   let stomped = false;
   let stompTimer = 0;
   let waitTimer = 0;
   return {
      id: KOOPA_ENEMY_TAG,
      add(this: Koopa) {
         origAvoidCliff = this.enabled;
         origPatrolling = this.enablePatrolling;
         origSpeed = this.speed;
         origDir = this.dir;
         this.onHeadbutted(this.die);
         this.onCollide('die', () => this.destroy());
         this.onCollide('player', (player, col) => {
            // Handle player kicking the shell when it's stationary.
            if (!isChar(player)) return;
            const leftOrRight = col?.isLeft() || col?.isRight();
            if (this.state===KOOPA_STATE.SHELL && this.dir===0 && col && leftOrRight) {
               col.preventResolution();
               player.kick();
               this.stomp(player);
            }
         });
         this.onCollide('immovable', (obj) => {
            // Make bump sound but only when you're a sliding shell.
            if (this.state!==KOOPA_STATE.SHELL || this.dir===0) return;
            k.play('bump-block');
            // And headbutt it if it's headbuttable.
            if (isHeadbuttable(obj)) obj.trigger('headbutted', actingPlayer);
         });
         this.onCollide('enemy', (otherEnemy, col) => {
            // When hitting enemies while sliding, give kicking player credit, and count this hits.
            if (!isEnemy(otherEnemy)) return;
            if (this.state===KOOPA_STATE.SHELL && this.dir && !otherEnemy.isFrozen) {
               col?.preventResolution();
               hitCount += 1;
               otherEnemy.points *= Math.pow(2, hitCount-1);
               otherEnemy.die(actingPlayer, hitCount);
            }
         });
      },
      get state(): KoopaState {
         return _state;
      },
      set state(val: KoopaState) {
         this.setState(val);
      },
      setState(this: Koopa, newState: KoopaState) {
         _state = newState;
         if (newState === KOOPA_STATE.FLY) {
            this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}-fly`);
            this.enabled = origAvoidCliff;
            this.enablePatrolling = origPatrolling;
            this.speed = origSpeed;
            this.dir = this.dir || origDir;
         } else if (newState === KOOPA_STATE.WALK) {
            this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}`);
            this.enabled = origAvoidCliff;
            this.enablePatrolling = origPatrolling;
            this.speed = origSpeed;
            this.dir = this.dir || origDir;
         } else if (newState === KOOPA_STATE.SHELL) {
            this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}-spin`, true);
            this.dir = 0;
            this.enabled = false;
            this.enablePatrolling = false;
         } else if (newState === KOOPA_STATE.DEAD) {
            this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}-spin`, true);
            this.flipY = true;
         }
      },
      get type(): KoopaType {
         return this.getType();
      },
      set type(val: KoopaType) {
         this.setType(val);
      },
      getType(this: Koopa): KoopaType {
         const t = this.getCurAnim()?.name.split('-')[1] ?? KOOPA_TYPES[0];
         if (isKoopaType(t)) return t;
         throw new Error(`Invalid koopa type: ${t}`);
      },
      setType(this: Koopa, val: KoopaType) {
         const t = isKoopaType(val) ? val : KOOPA_TYPES[0];
         this.setAnim(`${KOOPA_ENEMY_TAG}-${t}`);
      },
      die(this: Koopa, player: GameObj, hitCount = 0) {
         this.state = KOOPA_STATE.DEAD;
         if (player) player.trigger('collect', this);
         this.isFrozen = true;
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         this.vel = this.vel.add(k.vec2(0, -250*scale));
         this.stop();
         k.play('hit' + (hitCount<1 ? '' : hitCount>8 ? '8' : hitCount.toString()));
         this.trigger('die');
         k.wait(3, () => this.destroy());
      },
      stomp(this: Koopa, player: GameObj) {
         if (this.isStomped()) return;
         stomped = true;
         if (isChar(player)) {
            player.trigger('collect', this);
            actingPlayer = player;
         }
         if (this.state === KOOPA_STATE.FLY) {
            this.state = KOOPA_STATE.WALK;
            k.play('stomp');
         } else if (this.state === KOOPA_STATE.WALK) {
            this.state = KOOPA_STATE.SHELL;
            k.play('stomp');
         } else if (this.state === KOOPA_STATE.SHELL) {
            if (this.dir) {
               hitCount = 0;
               this.dir = 0;
               this.animSpeed = 1;
               this.stop();
               this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}-spin`, true);
               k.play('stomp');
            } else {
               this.dir = player.pos.x>=this.pos.x ? -1 : 1;
               this.speed = origSpeed * 7
               this.animSpeed = 2;
               this.play(`${KOOPA_ENEMY_TAG}-${this.type}-spin`);
               k.play('hit');
            }
         }
      },
      isStomped(): boolean {
         return stomped;
      },
      fixedUpdate(this: Koopa) {
         if (this.isFrozen) return;
         // TODO: Handle when state is FLY, so that Koopa bounces up and down while trying to fly.
         // TODO: Handle allowing player to pick up and carry/throw the shell.
         // TODO: Handle catching a "dead" shell and holding it.
         // Keep "stomped" state for a fraction, which protects the player from getting hurt while still
         // touching the koopa just after stomping it, since it doesn't immediately die.
         if (stomped) stompTimer += k.dt();
         if (stompTimer > 0.2) {
            stomped = false;
            stompTimer = 0;
         }
         // Wait timer where koopa wakes up after being stomped.
         if (this.dir) waitTimer = 0;
         else waitTimer += k.dt();
         if (waitTimer>10) {
            const action = waitTimer-Math.trunc(waitTimer) > 0.5 ? 'spin' : 'wake'
            this.setAnim(`${KOOPA_ENEMY_TAG}-${this.type}-${action}`, true);
         }
         if (waitTimer>15) this.state = KOOPA_STATE.WALK;
         // Keep the sprite facing the direction it's moving.
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
      general(),
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
