import k from '../../kaplayCtx';
import { Comp, TimerController } from 'kaplay';
import { Char } from '../index';

k.loadShader('invert', null, `
   uniform float u_time;
   vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
      vec4 c = def_frag();
      float t = (sin(u_time * 15.0) + 1.0) / 2.0;
      return mix(c, vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, c.a), t);
   }
`);

export interface FlashOpt {
   invert?: boolean;
   onDone?: Function;
}

const flashOptionDefaults: FlashOpt = {
   invert: true,
}

export interface FlashComp extends Comp {
   cancelFlash(): void;
   flash(duration: number, options?: FlashOpt): void;
}

export function flash(): FlashComp {
   let flashing = false;
   let timer: TimerController | undefined;
   let doneFn: (()=>void) | undefined;
   return {
      id: 'flash',
      cancelFlash() {
         timer?.cancel();
         doneFn?.();
      },
      flash(this: Char, duration: number, options: Partial<FlashOpt> = {}) {
         const { invert, onDone } = Object.assign({}, flashOptionDefaults, options);
         this.cancelFlash();
         flashing = true;
         if (invert) this.use(k.shader("invert", ()=>({ "u_time": k.time() })));
         const finalizeOnce = () => {
            if (doneFn !== finalizeOnce) return;
            timer = undefined;
            doneFn = undefined;
            flashing = false;
            if (invert) this.unuse('shader');
            onDone?.call(this);
         };
         doneFn = finalizeOnce;
         if (duration > 0) timer = k.wait(duration, finalizeOnce);
         else finalizeOnce();
      },
      fixedUpdate(this: Char) {
         if (flashing) {
            const t = k.time() * 30;
            this.color = k.rgb(
               k.wave(128, 255, t),
               k.wave(128, 255, t + 2),
               k.wave(128, 255, t + 4),
            );
         } else {
            this.color = k.WHITE;
         }
      }
   };
}
