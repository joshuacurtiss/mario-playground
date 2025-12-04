import { AnchorComp, AreaComp, BodyComp, GameObj, OffScreenComp, PosComp, ScaleComp, SpriteComp } from "kaplay";
import { CollectComp } from "./abilities/collect";
import { FreezeComp } from '../shared-abilities/freeze';
import { MoveComp } from './abilities/move';
import { PatrolComp } from "./abilities/patrol";
import { PointsComp } from '../shared-abilities/points';

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
   FreezeComp &
   MoveComp &
   PatrolComp &
   PointsComp;

export type Enemy = GameObj<EnemyComps>;

export { makeGoomba } from './goomba';
