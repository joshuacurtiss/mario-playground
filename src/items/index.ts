import { AreaComp, BodyComp, GameObj, OpacityComp, PosComp, ScaleComp, SpriteComp, Vec2 } from "kaplay";
import { makeBlock } from './block';
import { makeBrick } from './brick';
import { Coin, makeCoin, makeCoinWithBody } from './coin';
import { CoinPop, makeCoinPop } from './coinpop';
import { Powerup, makePowerup, make1Up, makeMushroom, makeFlower, makeLeaf, makeStar } from './powerup';

export type HeadbuttableComps =
   SpriteComp &
   PosComp &
   OpacityComp &
   AreaComp &
   BodyComp &
   ScaleComp;

export type Headbuttable = GameObj<HeadbuttableComps>;
export type HeadbuttableItem = CoinPop | Powerup;
export type CollectibleItem = Coin | Powerup;
export type ItemFactory = (pos: Vec2, options?: Record<string, any>) => GameObj;

export const factories = {
   "block": makeBlock,
   "brick": makeBrick,
   "coin": makeCoin,
   "coinwithbody": makeCoinWithBody,
   "coinpop": makeCoinPop,
   "powerup": makePowerup,
   "1up": make1Up,
   "mushroom": makeMushroom,
   "flower": makeFlower,
   "leaf": makeLeaf,
   "star": makeStar,
}

export { makeBlock } from './block';
export { makeBrick } from './brick';
export { makeCoin, makeCoinWithBody } from './coin';
export { makeCoinPop } from './coinpop';
export { makePowerup, make1Up, makeMushroom, makeFlower, makeLeaf, makeStar } from './powerup';
