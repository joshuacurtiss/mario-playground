import k, { debug } from '../kaplayCtx';
import { makePlayer } from '../entities/player';

const scale=4;
const spriteSize=16;

export default function() {
   k.setGravity(3100);
   // Ground
   for( let i=0 ; i<k.width()/scale/spriteSize ; i++ ) {
      k.add([
         k.sprite('items', { anim: 'grass' }),
         k.scale(scale),
         k.pos(i*scale*spriteSize, k.height()-spriteSize*scale),
      ]);
   }
   k.add([
      k.text('Use Arrow Keys to Move, Shift to Run, Z to Jump', { size: 24,  align: 'center', width: k.width() }),
      k.pos(0, 20),
      k.opacity(0.4),
   ])
   k.add([
      k.rect(k.width()*1.2, spriteSize*scale),
      k.opacity(0),
      k.pos(-k.width()/10, k.height()-(spriteSize-2)*scale),
      k.area(),
      k.body({ isStatic: true }),
   ]);
   const playerDebugText = debug ? k.add([
      k.text('', { size: 16, width: k.width()/2, lineSpacing: 3 }),
      k.anchor('topleft'),
      k.pos(10, 50),
      k.opacity(0.4),
   ]) : null;
   const player = makePlayer(k.vec2(k.randi(50, k.width()-50), k.height()-96), {
      debugText: playerDebugText,
   });
   k.onUpdate(() => {
      if (player.isOffScreen()) {
         if (player.pos.x<0) player.moveTo(k.width(), player.pos.y);
         else player.moveTo(0, player.pos.y);
      }
   });
};
