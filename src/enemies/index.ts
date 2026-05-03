import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, OffScreenComp, PosComp, ScaleComp, SpriteComp, Vec2, ZComp } from "kaplay";
import { CollectComp } from "./abilities/collect";
import { FreezeComp } from '../shared-abilities/freeze';
import { PointsComp } from '../shared-abilities/points';
import { GOOMBA_ENEMY_TAG, makeGoomba } from "./goomba";

export const ENEMY_TYPES = [ GOOMBA_ENEMY_TAG ] as const;
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
}

export { makeGoomba, isGoomba } from './goomba';
