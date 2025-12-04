import k, { scale } from "../kaplayCtx";
import { Vec2 } from "kaplay";

interface IndicatorOpt {
   msg?: string;
   sprite?: string;
   anim?: string;
}

export function makeIndicator(pos: Vec2, options: IndicatorOpt = {}) {
   const { msg, sprite, anim } = options;
   const indicator = k.add([
      msg ? k.text(msg, { size: 20, letterSpacing: -3 }) : '',
      sprite ? k.sprite(sprite, { anim }) : '',
      sprite ? k.scale(scale) : '',
      k.color(255, 255, 255),
      k.anchor('center'),
      k.pos(pos),
      k.body({ isStatic: true }),
      k.opacity(1),
      k.lifespan(0.5, {fade: 0.2 })
   ]);
   indicator.vel.y = -50;
   return indicator;
};
