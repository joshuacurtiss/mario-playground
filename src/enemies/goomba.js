import k, { scale } from "../kaplayCtx";
import { collect } from "./abilities/collect";
import { move } from "./abilities/move";
import { patrol } from "./abilities/patrol";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';

const optionDefaults = {
   char: 'goomba',
   move: { speed: 25 * scale },
   patrol: { radius: 1000 },
   points: 100,
};

export function makeGoomba(pos, options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   const { char } = opts;
   // TODO: Support `flying` goomba
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
      {
         add() {
            this.onHeadbutted(this.die);
         },
         die(player) {
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
         squash(player) {
            if (player) player.trigger('collect', this);
            this.play(`${char}-die`);
            k.play('stomp');
            this.trigger('die');
            this.freeze(0.5, { onDone: ()=>this.destroy() });
         }
      },
      'enemy',
      'goomba',
   ]);
};
