import k, { debug } from '../kaplayCtx';
import { makeFadeIn, makeFadeOut } from '../ui/fader';
import { makeCoin } from '../items/coin';
import { makePlayer } from '../entities/player';
import { makeGoomba } from '../entities/goomba';
import { makeCoinPop } from '../items/coinpop';
import { makeBlock } from '../items/block';
import { makeBrick } from '../items/brick';
import { makePowerup } from '../items/powerup';
import { makeHUD } from '../ui/hud';

const scale=4;
const gameTime=300;
const spriteSize=16;
const landSpriteCount = 49;

const fullWidth = k.width();
const fullHeight = k.height();
const halfWidth = fullWidth/2;
const halfHeight = fullHeight/2;

export default function() {
   let endTime = Math.ceil(k.time()) + gameTime;
   k.setGravity(3100);
   // Fade in
   makeFadeIn();
   // Ground
   for( let i=0 ; i<landSpriteCount ; i++ ) {
      k.add([
         k.sprite('items', { anim: 'grass' }),
         k.scale(scale),
         k.pos(i*scale*spriteSize, k.height()-spriteSize*scale*3),
         'ground',
      ]);
   }
   const ground = k.add([
      k.rect(landSpriteCount*spriteSize*scale, spriteSize/2*scale),
      k.color(0, 0, 0),
      k.z(-101),
      k.pos(0, k.height()-spriteSize*scale*3+4),
      k.area(),
      k.body({ isStatic: true }),
      'ground',
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
         k.scale(scale),
         k.pos(i*256*scale, 175),
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
         k.scale(scale),
         k.pos(i*512*scale, 40),
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
   const hud = ui.add(makeHUD());
   hud.world = 1;
   hud.time = endTime - k.time();

   // Player
   const player = makePlayer(k.vec2(k.randi(25, 150), 0), {
      debugText: playerDebugText,
   });
   player.on('die', () => {
      // Fade to black and go home
      k.wait(5, () => makeFadeOut({ onDone: () => k.go('home') }));
   });
   player.on('coinsChanged', newCoins=>hud.coins = newCoins);
   player.on('livesChanged', newLives=>hud.lives = newLives);
   player.on('scoreChanged', newScore=>hud.score = newScore);
   player.on('prunCountChanged', newCount=>hud.pCount = newCount);
   player.on('prunningChanged', isPrunning=>hud.pDash = isPrunning);
   hud.player = player.char;
   hud.lives = player.lives;
   hud.score = player.score;
   hud.coins = player.coins;
   // Coins
   for (let i=0; i<17; i++) {
      makeCoin(k.vec2(350*scale + i*16*scale, (i%2===0 ? 36 : 52)*scale));
   }
   // Blocks and Bricks
   for (let j=0 ; j<3 ; j++ ) {
      for (let i=0; i<10; i++) {
         const pos = k.vec2(400+j*896+i*16*scale, ground.pos.y-3*16*scale);
         if (i%3===0) {
            if (i===0 || i===9) makeBlock(pos.sub(0, 16*scale));
            makeBlock(pos);
         } else {
            makeBlock(pos, {
               type: 'question',
               items: i%3===1 ? Array(8).fill().map(()=>makeCoinPop(pos)) : makePowerup(pos),
            });
         }
      }
   }
   [1040, 1936].forEach(deltaX=>{
      for (let i=0; i<4; i++) {
         const pos = k.vec2(deltaX+i*16*scale, ground.pos.y-3*16*scale);
         makeBrick(pos);
         makeCoin(pos.sub(0, 16*scale), { hasBody: true });
      }
   });

   // Enemies
   function spawnGoomba() {
      if (k.get('goomba').length < 20) {
         makeGoomba(k.vec2(k.randi(600, 2600), 0), {
            char: k.randi() ? 'goomba' : 'goombared',
            boundaryLeft: 225,
            boundaryRight: 2775,
            dir: k.randi() ? -1 : 1,
         });
      }
      k.wait(k.rand(1.5, 3), spawnGoomba);
   }
   k.wait(2, spawnGoomba);
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
         if (k.getCamScale().x >= 1.95) return;
         k.setCamScale(k.getCamScale().add(0.1));
         k.debug.log('Cam Scale:', k.getCamScale().x.toFixed(1));
      });
   }
   // Cheat codes
   let keyLog = '';
   k.onKeyPress((key) => {
      keyLog = keyLog.slice(-20) + key;
      if (keyLog.endsWith('invulnerable')) {
         player.isInvulnerable = !player.isInvulnerable;
         k.debug.log(`Invulnerability is ${player.isInvulnerable ? 'ACTIVATED!' : 'off.'}`);
      } else if (keyLog.endsWith('hurt')) {
         player.hurt();
         k.debug.log('If you say so... OW!');
      } else if (keyLog.endsWith('grow')) {
         player.grow();
         k.debug.log('It\'s great to be BIG!');
      }
   });
   // Updates
   k.onUpdate(() => {
      // Disable camera movement if player is not alive
      if (!player.isAlive) return;
      // Update HUD time
      hud.time = endTime - k.time();
      if (hud.time<=0) {
         k.add([
            k.sprite('ui-time-up'),
            k.scale(4),
            k.pos(halfWidth, fullHeight),
            k.anchor('top'),
            k.body({ isStatic: true }),
            k.fixed(),
            k.z(200),
            {
               add() {
                  this.vel = k.vec2(0, -2000);
               },
               update() {
                  if (this.pos.y<fullHeight*0.3) this.vel.y = 0;
               }
            }
         ])
         player.die();
         return;
      }
      // Keep player within the edges. If we need to adjust, stop here.
      // The rest is camera work which will be affected by this change anyway.
      if (player.pos.x<ground.pos.x+20) {
         player.moveTo(ground.pos.x+20, player.pos.y);
         return;
      }
      if (player.pos.x>ground.pos.x-20+ground.width) {
         player.moveTo(ground.pos.x-20+ground.width, player.pos.y);
         return;
      }
      if (player.pos.y < -fullHeight*2) {
         player.moveTo(player.pos.x, -fullHeight*2);
         return;
      }
      // Figure out camera destination, centered on player.
      let camDest = k.getCamPos().lerp(k.vec2(player.pos.x, player.pos.y<0 ? halfHeight+player.pos.y-player.height : player.pos.y>ground.pos.y+25 ? player.pos.y : halfHeight), 0.08);
      // Do not let camera go beyond ground edges
      if (camDest.x-halfWidth < ground.pos.x) camDest.x = ground.pos.x+halfWidth;
      if (camDest.x+halfWidth > ground.pos.x+ground.width) camDest.x = ground.pos.x+ground.width-halfWidth;
      k.setCamPos(camDest);
      // Parallax BG
      bg.pos.x = (camDest.x - halfWidth) * 0.6 - fullWidth;
      clouds.pos.x = (camDest.x - halfWidth) * 0.9 - fullWidth;
   });
};
