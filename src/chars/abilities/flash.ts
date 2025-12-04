import k from '../../kaplayCtx';

k.loadShader('invert', null, `
   uniform float u_time;
   vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
      vec4 c = def_frag();
      float t = (sin(u_time * 15.0) + 1.0) / 2.0;
      return mix(c, vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, c.a), t);
   }
`);

const flashOptionDefaults = {
   invert: true,
   onDone: null,
}

export function flash() {
   let flashing = false;
   return {
      id: 'flash',
      flash(duration, options = flashOptionDefaults) {
         const { invert, onDone } = Object.assign({}, flashOptionDefaults, options);
         flashing = true;
         if (invert) this.use(k.shader("invert", ()=>({ "u_time": k.time() })));
         if (!duration) return;
         k.wait(duration, () => {
            flashing = false;
            if (invert) this.unuse('shader');
            if (onDone) onDone.call(this);
         });
      },
      fixedUpdate() {
         if (flashing) {
            const t = k.time() * 30;
            this.color = k.rgb(
               k.wave(128, 255, t),
               k.wave(128, 255, t + 2),
               k.wave(128, 255, t + 4),
            );
         } else {
            this.color = k.rgb(255, 255, 255);
         }
      }
   };
}
