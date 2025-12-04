import k, { scale } from "../kaplayCtx";
import variableJump from "./abilities/variable-jump";
import { coins } from "./abilities/coins";
import { fireball } from './abilities/fireball';
import { flash } from './abilities/flash';
import { CharName, general, Power, Size } from './abilities/general';
import { invulnerable } from './abilities/invulnerable';
import { lives } from "./abilities/lives";
import { mushroom } from './abilities/mushroom';
import { raccoon } from './abilities/raccoon';
import { score } from "./abilities/score";
import { star } from './abilities/star';
import { freeze } from '../shared-abilities/freeze';
import { Vec2 } from "kaplay";
import { Char } from ".";

const char: CharName = 'mario';

export interface MarioOpt {
   power: Power;
   size: Size
}

const optionDefaults: MarioOpt = {
   power: 'normal',
   size: 'sm',
};

export function makeMario(pos: Vec2, options: Partial<MarioOpt> = {}): Char {
   const opts = Object.assign({}, optionDefaults, options);
   const { power, size } = opts;
   return k.add([
      k.sprite(`${char}-${power}`, { frame: 0, flipX: true }),
      k.scale(scale),
      k.area(),
      k.anchor('bot'),
      k.color(k.WHITE),
      k.opacity(1),
      k.pos(pos),
      k.body(),
      k.z(1),
      k.offscreen({ distance: 7*scale }),
      // Run raccoon before general since general handles jumping which interferes with raccoon jumping
      raccoon(),
      general({ size }),
      coins(),
      fireball(),
      flash(),
      invulnerable(),
      lives(),
      mushroom(),
      score(),
      star(),
      freeze(),
      variableJump(),
      'player',
   ]);
}