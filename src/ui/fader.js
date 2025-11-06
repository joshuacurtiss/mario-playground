import k from '../kaplayCtx';

const optionDefaults = {
   color: k.BLACK,
   speed: 1,
   direction: 'out', // 'in' or 'out'
   onDone: ()=>{},
};

export default function makeFader(options = {}) {
   const { color, speed, direction, onDone } = Object.assign({}, optionDefaults, options);
   const opacity = direction==='in' ? 1 : 0;
   return k.add([
      k.rect(k.width(), k.height()),
      k.color(color),
      k.pos(k.toWorld(k.vec2(0, 0))),
      k.body({ isStatic: true }),
      k.z(999999),
      k.opacity(opacity),
      {
         update() {
            if (direction==='out' && this.opacity<1) {
               this.opacity += k.dt() * speed;
            } else if (direction==='in' && this.opacity>0) {
               this.opacity -= k.dt() * speed;
            } else {
               onDone();
               k.wait(1, () => this.destroy());
            }
         },
      },
   ]);
}

export function makeFadeIn(options = {}) {
   return makeFader({ direction: 'in', ...options });
}

export function makeFadeOut(options = {}) {
   return makeFader({ direction: 'out', ...options });
}
