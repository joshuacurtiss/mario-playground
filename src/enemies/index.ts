import { AnchorComp, AreaComp, BodyComp, Comp, GameObj, OffScreenComp, PosComp, ScaleComp, SpriteComp } from "kaplay";
import { CollectComp } from "./abilities/collect";
import { FreezeComp } from '../shared-abilities/freeze';
import { MoveComp } from './abilities/move';
import { PatrolComp } from "./abilities/patrol";
import { PointsComp } from '../shared-abilities/points';

// These are expected to be implemented by enemy types
export interface EnemyComp extends Comp {
   die(player: GameObj): void;
   squash(player: GameObj): void;
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
   // Custom
   CollectComp &
   EnemyComp &
   FreezeComp &
   MoveComp &
   PatrolComp &
   PointsComp;

export type Enemy = GameObj<EnemyComps>;

export function isEnemy(obj: GameObj): obj is Enemy {
   return obj.has(['sprite', 'area', 'pos', 'collect', 'freeze', 'move', 'patrol', 'points']) && obj.is('enemy');
}

export { makeGoomba, isGoomba } from './goomba';
