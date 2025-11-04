import k, { debug } from '../kaplayCtx';
import { makePlayer } from '../entities/player';

const scale=4;
const spriteSize=16;
const landSpriteCount = 50;

export default function() {
   k.setGravity(3100);
   // Ground
   for( let i=0 ; i<landSpriteCount ; i++ ) {
      k.add([
         k.sprite('items', { anim: 'grass' }),
         k.scale(scale),
         k.pos(i*scale*spriteSize, k.height()-spriteSize*scale),
      ]);
   }
   k.add([
      k.rect((landSpriteCount+2)*spriteSize*scale, spriteSize*scale),
      k.opacity(0),
      k.pos(-spriteSize*scale, k.height()-(spriteSize-2)*scale),
      k.area(),
      k.body({ isStatic: true }),
   ]);
   const ui = k.add([ k.fixed() ]);
   ui.add([
      k.text('Use Arrow Keys to Move, Shift to Run, Z to Jump', { size: 24,  align: 'center', width: k.width() }),
      k.pos(0, 20),
      k.opacity(0.4),
   ])
   const playerDebugText = debug ? ui.add([
      k.text('', { size: 16, width: k.width()/2, lineSpacing: 3 }),
      k.anchor('topleft'),
      k.pos(10, 50),
      k.opacity(0.4),
   ]) : null;
   const player = makePlayer(k.vec2(k.randi(50, k.width()-50), k.height()-96), {
      debugText: playerDebugText,
   });
   k.onUpdate(() => {
      k.setCamPos(k.getCamPos().lerp(k.vec2(player.pos.x, k.height()/2), 0.08));
      if (player.pos.x<0) player.moveTo(0, player.pos.y);
      if (player.pos.x>landSpriteCount*scale*spriteSize) player.moveTo(landSpriteCount*scale*spriteSize, player.pos.y);
   });
};
