import k, { scale } from "../kaplayCtx";
import variableJump from "./abilities/variable-jump";
import { coins } from "./abilities/coins";
import { fireball } from './abilities/fireball';
import { flash } from './abilities/flash';
import { general } from './abilities/general';
import { invulnerable } from './abilities/invulnerable';
import { lives } from "./abilities/lives";
import { mushroom } from './abilities/mushroom';
import { raccoon } from './abilities/raccoon';
import { score } from "./abilities/score";
import { star } from './abilities/star';
import { freeze } from '../shared-abilities/freeze';

const char = 'mario';

const optionDefaults = {
   power: 'normal',
   size: 'sm',
};

export function makeMario(pos, options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   const { power, size } = opts;
   return k.add([
      k.sprite(`${char}-${power}`, { frame: 0, flipX: true }),
      k.scale(scale),
      k.area(),
      k.anchor('bot'),
      k.pos(pos),
      k.body(),
      k.z(1),
      k.offscreen({ distance: 7*scale }),
      general({ size }),
      coins(),
      fireball(),
      flash(),
      invulnerable(),
      lives(),
      mushroom(),
      raccoon(),
      score(),
      star(),
      freeze(),
      variableJump(),
      'player',
   ]);
}