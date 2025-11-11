import k from "../kaplayCtx";

export function makeIndicator(pos, msg) {
   const indicator = k.add([
      k.text(msg, { size: 20, letterSpacing: -3 }),
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
