import { AreaComp, BodyComp, GameObj, PosComp, ScaleComp, SpriteComp } from "kaplay";
import { CoinPop } from './coinpop';
import { Powerup } from './powerup';
import { Coin } from "./coin";

export type HeadbuttableComps =
   SpriteComp &
   PosComp &
   AreaComp &
   BodyComp &
   ScaleComp;

export type Headbuttable = GameObj<HeadbuttableComps>;
export type HeadbuttableItem = CoinPop | Powerup;
export type CollectibleItem = Coin | Powerup;

export { makeBlock } from './block';
export { makeBrick } from './brick';
export { makeCoin, makeCoinWithBody } from './coin';
export { makeCoinPop } from './coinpop';
export { makePowerup } from './powerup';
