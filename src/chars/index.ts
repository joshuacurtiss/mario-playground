import { AnchorComp, AreaComp, BodyComp, ColorComp, GameObj, OffScreenComp, OpacityComp, PosComp, ScaleComp, SpriteComp, ZComp } from 'kaplay';
import { FireballComp } from './abilities/fireball';
import { MushroomComp } from './abilities/mushroom';
import { FreezeComp } from '../shared-abilities/freeze';
import { CoinsComp } from './abilities/coins';
import { FlashComp } from './abilities/flash';
import { ScoreComp } from './abilities/score';
import { StarComp } from './abilities/star';
import { VariableJumpComp } from './abilities/variable-jump';
import { LivesComp } from './abilities/lives';
import { GeneralComp } from './abilities/general';
import { InvulnerableComp } from './abilities/invulnerable';
import { RaccoonComp } from './abilities/raccoon';

export type CharComps =
   // Built-ins
   AnchorComp &
   AreaComp &
   BodyComp &
   ColorComp &
   OffScreenComp &
   OpacityComp &
   PosComp &
   ScaleComp &
   SpriteComp &
   ZComp &
   // Custom
   CoinsComp &
   FireballComp &
   FlashComp &
   FreezeComp &
   GeneralComp &
   InvulnerableComp &
   LivesComp &
   MushroomComp &
   RaccoonComp &
   ScoreComp &
   StarComp &
   VariableJumpComp;

export type Char = GameObj<CharComps>;

export function isChar(obj: GameObj): obj is Char {
   return obj.has(['coins', 'fireball', 'flash', 'freeze', 'general', 'lives', 'mushroom', 'raccoon']) && obj.is('player');
}

export { makeMario } from './mario';
