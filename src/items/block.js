import k, { scale } from '../kaplayCtx';
import { bump } from '../abilities/bump';
import { items } from '../abilities/items';

const optionDefaults = {
   type: 'empty', // 'empty' | 'wood' | 'question'
   items: null, // Item(s) to spawn when bumped
};

export function makeBlock(pos, options = {}) {
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
