import k from '../kaplayCtx';

const bodyOptionDefaults = {
   gravityScale: 0.75,
   drag: 0.75,
   maxVelocity: 1800,
};
const optionDefaults = {
   type: 'gold', // 'gold' or 'blue'
   hasBody: false,
   velocity: k.vec2(0, 0),
   expire: null,
   bodyOptions: { ...bodyOptionDefaults },
};

export function makeCoin(pos, options = {}) {
   const bodyOptions = Object.assign({}, bodyOptionDefaults, options.bodyOptions || {})
   const { type, hasBody, velocity, expire } = Object.assign({}, optionDefaults, options);
   let expiringSoon = false;
   const obj = k.add([
      k.sprite('items', { anim: `coin-${type}` }),
      k.pos(pos),
      k.area({
         shape: new k.Rect(k.vec2(3, 0), 10, 16),
         collisionIgnore: [ 'coin', 'enemy' ],
      }),
      k.scale(4),
      k.offscreen({ pause: true, unpause: true }),
      'coin',
      {
         collect() {
            k.play('coin');
            k.destroy(this);
         },
      }
   ]);
   // Handle expiration
   if (expire) {
      k.wait(expire, ()=>obj.destroy());
      k.wait(expire>2 ? expire-2 : 0, ()=>expiringSoon=true);
      obj.onUpdate(()=>{
         // Flash when expiring soon
         if (expiringSoon) obj.opacity = k.wave(0.2, 0.8, k.time() * 75);
      });
   }
   // Handle body and velocity
   if (hasBody) {
      obj.use(k.body(bodyOptions));
      const bounce = (_, col) => {
         if (!hasBody) return;
         if (col.normal.x) obj.vel = obj.vel.scale(-0.85, 1);
         if (col.normal.y) obj.vel = obj.vel.scale(1, col.normal.y<0 ? -0.75 : 1);
      };
      ['ground', 'block-or-brick'].forEach(tag=>obj.onCollide(tag, bounce));
   }
   // Initial velocity
   obj.vel = velocity;
   return obj;
}
