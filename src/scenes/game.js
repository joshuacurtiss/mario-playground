import k from '../kaplayCtx';
import { makePlayer } from '../entities/player';

const scale=4;
const spriteSize=16;

export default function() {
   k.setGravity(3100);
   const player = makePlayer('mario');
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
   k.onUpdate(() => {
      if (player.isOffScreen()) {
         if (player.pos.x<0) player.moveTo(k.width(), player.pos.y);
         else player.moveTo(0, player.pos.y);
      }
   });
};
