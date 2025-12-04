import k, { scale } from "../kaplayCtx";
import { Comp, GameObj, Vec2 } from 'kaplay';
import { Enemy, EnemyComp, EnemyComps, isEnemy } from './index';
import { collect } from "./abilities/collect";
import { move, MoveCompOpt } from "./abilities/move";
import { patrol, PatrolCompOpt } from "./abilities/patrol";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';

export type GoombaChar = 'goomba' | 'goombared';

export function isGoombaChar(val: string): val is GoombaChar {
   return ['goomba', 'goombared'].includes(val);
}

export type Goomba = GameObj<EnemyComps & GoombaComp>;

export function isGoomba(obj: GameObj): obj is Goomba {
   return isEnemy(obj) && obj.has('goomba');
}
export interface GoombaComp extends EnemyComp {
   get char(): GoombaChar;
   set char(val: GoombaChar);
   getSprite(): GoombaChar;
   setSprite(newSprite: GoombaChar): void;
}

function goomba(): GoombaComp {
   return {
      id: 'goomba',
      add(this: Goomba) {
         this.onHeadbutted(this.die);
      },
      get char(): GoombaChar {
         return this.getSprite();
      },
      set char(val: GoombaChar) {
         this.setSprite(val);
      },
      getSprite(this: Enemy): GoombaChar {
         if (!isGoombaChar(this.sprite)) return 'goomba';
         return this.sprite;
      },
      setSprite(this: Goomba, newSprite: GoombaChar) {
         if (this.sprite === newSprite) return;
         const { flipX, frame } = this;
         this.use(k.sprite(newSprite, { frame, flipX }));
      },
      die(this: Enemy, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.isFrozen = true;
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         this.vel = k.vec2(0, -175*scale);
         this.flipY = true;
         this.stop();
         k.play('hit');
         this.trigger('die');
         k.wait(3, () => this.destroy());
      },
      squash(this: Goomba, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.play(`${this.char}-die`);
         k.play('stomp');
         this.trigger('die');
         this.freeze(0.5, { onDone: ()=>this.destroy() });
      }
   };
}

interface GoombaOpt {
   char: GoombaChar;
   move?: MoveCompOpt;
   patrol?: PatrolCompOpt;
   points?: number;
}

const optionDefaults: GoombaOpt = {
   char: 'goomba',
   move: { speed: 25 * scale },
   patrol: { radius: 1000 },
   points: 100,
};

export function makeGoomba(pos: Vec2, options = optionDefaults): Goomba {
   const opts = Object.assign({}, optionDefaults, options);
   const { char } = opts;
   return k.add([
      k.sprite('enemies', { anim: char }),
      k.scale(0.975 * scale),
      k.area({
         shape: new k.Rect(k.vec2(0, -1), 14, 15),
         collisionIgnore: [ 'coin' ],
      }),
      k.anchor('bot'),
      k.pos(pos),
      k.body(),
      k.offscreen({ distance: 10000, destroy: true }),
      collect(),
      move(opts.move),
      patrol({ pos, ...opts.patrol }),
      points(opts.points),
      freeze(),
      goomba(),
      'enemy',
      'goomba',
   ]);
};
