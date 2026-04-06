import k, { scale } from '../kaplayCtx';
import type { GameObj, Vec2 } from 'kaplay';
import { bump, BumpComp } from './abilities/bump';
import { items, ItemComp } from './abilities/items';
import { HeadbuttableItem, HeadbuttableComps } from './index';

export type Block = GameObj<HeadbuttableComps & BumpComp & ItemComp>;

export type BlockType = 'empty' | 'wood' | 'question';

export interface BlockOpt {
   type?: BlockType;
   items?: HeadbuttableItem | HeadbuttableItem[];
}

const optionDefaults: BlockOpt = {
   type: 'empty',
};

export function makeBlock(pos: Vec2, options: BlockOpt = {}): Block {
   let { type, items: itemsArray } = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: `block-${type}` }),
      k.pos(pos),
      k.area({shape: new k.Rect(k.vec2(1, 0), 14, 16) }),
      k.body({ isStatic: true }),
      k.scale(scale),
      bump(),
      items(itemsArray ?? []),
      'block',
      `block-${type}`,
      'immovable',
   ]);
}
