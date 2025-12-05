import { AreaComp, BodyComp, GameObj, PosComp, ScaleComp, SpriteComp } from "kaplay";

export type HeadbuttableComps =
   SpriteComp &
   PosComp &
   AreaComp &
   BodyComp &
   ScaleComp;

export type Headbuttable = GameObj<HeadbuttableComps>;

export { makeBlock } from './block';
export { makeBrick } from './brick';
