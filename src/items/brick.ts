import k, { scale } from '../kaplayCtx';
import type { GameObj, SpriteComp, PosComp, AreaComp, BodyComp, ScaleComp, Vec2 } from 'kaplay';
import { breaks, BreaksComp } from './abilities/breaks';
import { bump } from './abilities/bump';
import { items } from './abilities/items';

// TODO: Needs to add the custom comp types (bump, items) once they're authored
export type Brick = GameObj<SpriteComp & PosComp & AreaComp & BodyComp & ScaleComp & BreaksComp>;

export type BrickType = 'normal' | 'ice';

export interface BrickOpt {
   type?: BrickType;
   // TODO: Use more specific type that encompasses all possible items in blocks
   items?: GameObj | GameObj[];
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
      items(itemsArray),
      'brick',
      `brick-${type}`,
      'block-or-brick',
   ]);
}
