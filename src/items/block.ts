import k, { scale } from '../kaplayCtx';
import type { GameObj, SpriteComp, PosComp, AreaComp, BodyComp, ScaleComp, Vec2 } from 'kaplay';
import { bump } from './abilities/bump';
import { items } from './abilities/items';

// TODO: Needs to add the custom comp types (bump, items) once they're authored
export type Block = GameObj<SpriteComp & PosComp & AreaComp & BodyComp & ScaleComp>;

export type BlockType = 'empty' | 'wood' | 'question';

export interface BlockOpt {
   type?: BlockType;
   // TODO: Use more specific type that encompasses all possible items in blocks
   items?: GameObj | GameObj[];
}

const optionDefaults: BlockOpt = {
   type: 'empty',
};

export function makeBlock(pos: Vec2, options: BlockOpt = {}): Block {
   let { type, items: itemsArray } = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: `block-${type}` }),
      k.pos(pos),
      k.area(),
      k.body({ isStatic: true }),
      k.scale(scale),
      bump(),
      items(itemsArray),
      'block',
      `block-${type}`,
      'block-or-brick',
   ]);
}
