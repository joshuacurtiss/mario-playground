import k, { scale } from '../kaplayCtx';
import { breaks } from './abilities/breaks';
import { bump } from './abilities/bump';
import { items } from './abilities/items';

const optionDefaults = {
   type: 'normal', // 'normal' | 'ice'
   items: null, // Item(s) to spawn when bumped
};

export function makeBrick(pos, options = {}) {
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
