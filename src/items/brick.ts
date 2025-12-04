import k, { scale } from '../kaplayCtx';
import type { GameObj, Vec2 } from 'kaplay';
import { breaks, BreaksComp } from './abilities/breaks';
import { bump, BumpComp } from './abilities/bump';
import { items, ItemComp } from './abilities/items';
import { HeadbuttableItem, HeadbuttableComps } from './index';

export type Brick = GameObj<HeadbuttableComps & BreaksComp & BumpComp & ItemComp>;
export type BrickType = 'normal' | 'ice';

export interface BrickOpt {
   type?: BrickType;
   items?: HeadbuttableItem | HeadbuttableItem[];
}

const optionDefaults: BrickOpt = {
   type: 'normal',
};

export function makeBrick(pos: Vec2, options: BrickOpt = {}): Brick {
   let { type, items: itemsArray } = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: `brick-${type}` }),
      k.pos(pos),
      k.area(),
      k.body({ isStatic: true }),
      k.scale(scale),
      breaks(),
      bump(),
      items(itemsArray ?? []),
      'brick',
      `brick-${type}`,
      'block-or-brick',
   ]);
}
