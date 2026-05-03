import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, OffScreenComp, PosComp, ScaleComp, SpriteComp, Vec2, ZComp } from "kaplay";
import { CollectComp } from "./abilities/collect";
import { FreezeComp } from '../shared-abilities/freeze';
import { PointsComp } from '../shared-abilities/points';
import { GOOMBA_ENEMY_TAG, makeGoomba } from "./goomba";
import { makePiranha, makePiranhaWithFireball, PIRANHA_ENEMY_TAG, PIRANHA_FIRE_ENEMY_TAG, PIRANHA_KINDS } from './piranha';

export const ENEMY_TYPES = [ GOOMBA_ENEMY_TAG, ...PIRANHA_KINDS ] as const;
export type EnemyType = typeof ENEMY_TYPES[number];

export function isEnemyType(value: unknown): value is EnemyType {
   return typeof value === 'string' && ENEMY_TYPES.includes(value as any);
}

// These are expected to be implemented by enemy types
export interface EnemyComp extends Comp {
   die(player: GameObj): void;
   stomp(player: GameObj): void;
}

export type EnemyComps =
   // Built-ins
   AnchorComp &
   AreaComp &
   BodyComp &
   PosComp &
   OffScreenComp &
   ScaleComp &
   SpriteComp &
   ZComp &
   // Custom
   CollectComp &
   EnemyComp &
   FreezeComp &
   PointsComp;

export type Enemy = GameObj<EnemyComps>;
export type EnemyFactory = (pos: Vec2, options?: Record<string, any>) => Enemy;

export function isEnemy(obj: GameObj): obj is Enemy {
   return obj.has(['sprite', 'area', 'body', 'pos', 'collect', 'freeze', 'points', 'z']) && obj.is('enemy');
}

export const factories = {
   [GOOMBA_ENEMY_TAG]: makeGoomba,
   [PIRANHA_ENEMY_TAG]: makePiranha,
   [PIRANHA_FIRE_ENEMY_TAG]: makePiranhaWithFireball,
}

export { makeGoomba, isGoomba } from './goomba';
export { makePiranha, makePiranhaWithFireball, isPiranha } from './piranha';
