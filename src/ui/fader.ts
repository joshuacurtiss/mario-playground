import k from '../kaplayCtx';
import { AnchorComp, BodyComp, Color, ColorComp, GameObj, OpacityComp, PosComp, RectComp, ScaleComp, ZComp } from 'kaplay';

type FadeDirection = 'in' | 'out';

type Fader = GameObj<ColorComp & ScaleComp & AnchorComp & PosComp & BodyComp & ZComp & OpacityComp & RectComp>;

interface FaderOpt {
   color?: Color;
   speed?: number;
   direction?: FadeDirection;
   onDone?: Function;
}

const optionDefaults: FaderOpt = {
   color: k.BLACK,
   speed: 1,
   direction: 'out',
   onDone: ()=>{},
};

export default function makeFader(options: FaderOpt = {}): Fader {
   const { color, speed, direction, onDone } = Object.assign({}, optionDefaults, options);
   const opacity = direction==='in' ? 1 : 0;
   return k.add([
      k.rect(k.width(), k.height()),
      k.color(color ?? k.BLACK),
      k.scale(1),
      k.anchor('center'),
      k.pos(k.vec2(k.width()/2, k.height()/2)),
      k.body({ isStatic: true }),
      k.z(999999),
      k.opacity(opacity),
      {
         fixedUpdate(this: Fader) {
            // Keep fader positioned over camera
            const camScale = k.getCamScale();
            const newScale = k.vec2(1/camScale.x, 1/camScale.y);
            const newPos = k.getCamPos();
            if (!this.pos.eq(newPos)) this.pos = newPos;
            if (!this.scale.eq(newScale)) this.scale = newScale;
            // Handle zoom in/out
            if (!speed) return;
            if (direction==='out' && this.opacity<1) {
               this.opacity += k.dt() * speed;
            } else if (direction==='in' && this.opacity>0) {
               this.opacity -= k.dt() * speed;
            } else {
               if (onDone) onDone();
               k.wait(1, () => this.destroy());
            }
         },
      },
   ]);
}

export function makeFadeIn(options: Omit<FaderOpt, 'direction'> = {}) {
   return makeFader({ direction: 'in', ...options });
}

export function makeFadeOut(options: Omit<FaderOpt, 'direction'> = {}) {
   return makeFader({ direction: 'out', ...options });
}
