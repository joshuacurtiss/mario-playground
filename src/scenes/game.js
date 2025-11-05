import k, { debug } from '../kaplayCtx';
import { makePlayer } from '../entities/player';

const scale=4;
const spriteSize=16;
const landSpriteCount = 50;

const fullWidth = k.width();
const fullHeight = k.height();
const halfWidth = fullWidth/2;
const halfHeight = fullHeight/2;

export default function() {
   k.setGravity(3100);
   // Ground
   for( let i=0 ; i<landSpriteCount ; i++ ) {
      k.add([
         k.sprite('items', { anim: 'grass' }),
         k.scale(scale),
         k.pos(i*scale*spriteSize, k.height()-spriteSize*scale*2),
      ]);
   }
   const ground = k.add([
      k.rect(landSpriteCount*spriteSize*scale, spriteSize*scale),
      k.color(0, 0, 0),
      k.z(-101),
      k.pos(0, k.height()-spriteSize*scale*2+4),
      k.area(),
      k.body({ isStatic: true }),
   ]);
   // Clouds
   const clouds = k.add([
      k.z(-100),
      k.pos(0, 0),
   ]);
   for (let i=0; i*256*scale<=k.width()*2; i++) {
      clouds.add([
         k.sprite('bg-clouds'),
         k.anchor('botleft'),
         k.scale(4),
         k.pos(i*256*scale, 230),
      ]);
   }
   // Background
   const bg = k.add([
      k.z(-101),
      k.pos(0, 0),
   ]);
   for (let i=0; i*512*scale<fullWidth*2; i++) {
      bg.add([
         k.sprite('bg-grassland'),
         k.scale(4),
         k.pos(i*512*scale, 110),
      ]);
   }
   // UI
   const ui = k.add([ k.fixed() ]);
   ui.add([
      k.text('Use Arrow Keys to Move, Shift to Run, Z to Jump', { size: 24,  align: 'center', width: fullWidth }),
      k.color(0, 0, 0),
      k.pos(0, 20),
      k.opacity(0.8),
   ])
   const playerDebugText = debug ? ui.add([
      k.text('', { size: 16, width: halfWidth, lineSpacing: 3 }),
      k.anchor('topleft'),
      k.pos(10, 50),
      k.color(0, 0, 0),
   ]) : null;
   // Player
   const player = makePlayer(k.vec2(k.randi(halfWidth/2, halfWidth), fullHeight-96), {
      debugText: playerDebugText,
   });
   // All camera zooming in debug mode
   if (debug) {
      k.onKeyPress('escape', () => {
         k.debug.paused = !k.debug.paused;
      });
      k.onKeyPress('tab', () => {
         if (k.debug.paused) k.debug.stepFrame();
      });
      k.onKeyPress('-', () => {
         if (k.getCamScale().x <= 0.11) return;
         k.setCamScale(k.getCamScale().sub(0.1));
         k.debug.log('Cam Scale:', k.getCamScale().x.toFixed(1));
      });
      k.onKeyPress('=', () => {
         if (k.getCamScale().x >= 0.99) return;
         k.setCamScale(k.getCamScale().add(0.1));
         k.debug.log('Cam Scale:', k.getCamScale().x.toFixed(1));
      });
   }
   // Updates
   k.onUpdate(() => {
      // Keep player within the edges. If we need to adjust, stop here.
      // The rest is camera work which will be affected by this change anyway.
      if (player.pos.x<ground.pos.x) {
         player.moveTo(ground.pos.x, player.pos.y);
         return;
      }
      if (player.pos.x>ground.pos.x+ground.width) {
         player.moveTo(ground.pos.x+ground.width, player.pos.y);
         return;
      }
      if (player.pos.y < -fullHeight*2) {
         player.moveTo(player.pos.x, -fullHeight*2);
         return;
      }
      // Figure out camera destination, centered on player.
      let camDest = k.getCamPos().lerp(k.vec2(player.pos.x, player.pos.y<0 ? halfHeight+player.pos.y-player.height : player.pos.y>ground.pos.y ? player.pos.y : halfHeight), 0.08);
      // Do not let camera go beyond ground edges
      if (camDest.x-halfWidth < ground.pos.x) camDest.x = ground.pos.x+halfWidth;
      if (camDest.x+halfWidth > ground.pos.x+ground.width) camDest.x = ground.pos.x+ground.width-halfWidth;
      k.setCamPos(camDest);
      // Parallax BG
      bg.pos.x = (camDest.x - halfWidth) * 0.6 - fullWidth;
      clouds.pos.x = (camDest.x - halfWidth) * 0.9 - fullWidth;
   });
};
