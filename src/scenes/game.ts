import k, { debug, scale } from '../kaplayCtx';
import { BodyComp, GameObj, PosComp } from 'kaplay';
import makeMap from '../lib/map';
import { makeFadeIn, makeFadeOut } from '../ui/fader';
import { makeMario } from '../chars/mario';
import { makeHUD } from '../ui/hud';
import { GOOMBA_ENEMY_TAG, makeGoomba } from '../enemies/goomba';

const gameTime=300;

const fullWidth = k.width();
const fullHeight = k.height();
const halfWidth = fullWidth/2;
const halfHeight = fullHeight/2;

function clamp(v: number, min: number, max: number) {
   return Math.min(Math.max(v, min), max);
}

export default async function() {
   let endTime = Math.ceil(k.time()) + gameTime;
   k.setGravity(3100);
   // Fade in
   makeFadeIn();
   // Load level and map data
   const mapJson = await fetch('assets/levels/1-1.tmj'),
         mapData = await mapJson.json(),
         map = makeMap(mapData, k.vec2(0, -432), scale);

   map.generateTilesData();
   map.render();

   // Calculate ground and camera boundaries based on map data
   const groundObjects = map.mapData.layers.find((l: any) => l.name === 'colliders').objects.filter((o: any) => o.type === 'ground');
   const groundMinX = Math.min(...groundObjects.map((o: any) => o.x));
   const groundMaxX = Math.max(...groundObjects.map((o: any) => o.x + o.width));
   const groundMaxY = Math.max(...groundObjects.map((o: any) => o.y + o.height));
   const worldMinX = groundMinX * scale;
   const worldMaxX = groundMaxX * scale;
   const camMinX = worldMinX + halfWidth;
   const camMaxX = worldMaxX - halfWidth;

   // UI
   const ui = k.add([
      k.fixed(),
      k.z(1001),
   ]);
   ui.add([
      k.text('Use Arrow Keys to Move, Shift to Run, Z to Jump', { size: 24,  align: 'center', width: fullWidth }),
      k.color(0, 0, 0),
      k.pos(0, 4*scale),
      k.opacity(0.8),
   ])
   const playerDebugText = debug ? ui.add([
      k.text('', { size: 16, width: halfWidth, lineSpacing: 3 }),
      k.anchor('topleft'),
      k.pos(2*scale, 12*scale),
      k.color(0, 0, 0),
   ]) : null;
   const hud = ui.add(makeHUD());
   hud.world = 1;
   hud.time = endTime - k.time();

   // Player
   const playerSpawnPos = k.choose(map.spawn.filter(s=>s.name === 'player' || s.name === 'mario')).pos;
   const player = makeMario(playerSpawnPos);
   player.on('die', () => {
      // Fade to black and go home
      k.wait(5, () => makeFadeOut({ onDone: () => k.go('home') }));
   });
   player.on('coinsChanged', newCoins=>hud.coins = newCoins);
   player.on('livesChanged', newLives=>hud.lives = newLives);
   player.on('scoreChanged', newScore=>hud.score = newScore);
   player.on('prunCountChanged', newCount=>hud.pCount = newCount);
   player.on('prunningChanged', isPrunning=>hud.pDash = isPrunning);
   player.onCollide('die', () => player.die());
   hud.player = player.char;
   hud.lives = player.lives;
   hud.score = player.score;
   hud.coins = player.coins;

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
   // Goomba spawning
   k.loop(5, () => {
      if (player.isFrozen) return;
      if (k.get(GOOMBA_ENEMY_TAG).length < 5) {
         const spawnPoint = k.choose(map.spawn.filter(s => s.name === GOOMBA_ENEMY_TAG));
         if (spawnPoint) makeGoomba(spawnPoint.pos);
      }
   });
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
      } else if (keyLog.endsWith('flower')) {
         player.size = 'lg';
         player.power = 'fire';
         k.debug.log('Those who play with fire get burned! Oh wait, you wanted this? Enjoy your new fire powers!');
      } else if (keyLog.endsWith('raccoon')) {
         player.size = 'lg';
         player.power = 'raccoon';
         k.debug.log('Raccoon power, eh? Don\'t forget to flap your arms when you jump!');
      } else if (keyLog.endsWith('grow')) {
         player.grow();
         k.debug.log('It\'s great to be BIG!');
      }
   });
   // Updates
   k.onFixedUpdate(() => {
      // Update debug text
      if (debug && playerDebugText) playerDebugText.text = player.debug;
      // Disable camera movement if player is frozen
      if (player.isFrozen) return;
      // Update HUD time
      hud.time = endTime - k.time();
      if (hud.time<=0) {
         k.add([
            k.sprite('ui-time-up'),
            k.scale(scale),
            k.pos(halfWidth, fullHeight),
            k.anchor('top'),
            k.body({ isStatic: true }),
            k.fixed(),
            k.z(200),
            {
               add(this: GameObj<BodyComp>) {
                  this.vel = k.vec2(0, -500*scale);
               },
               update(this: GameObj<BodyComp & PosComp>) {
                  if (this.pos.y<fullHeight*0.3) this.vel.y = 0;
               }
            }
         ])
         player.die();
         return;
      }
      // Keep player within the edges. If we need to adjust, stop here.
      // The rest is camera work which will be affected by this change anyway.
      if (player.pos.x<worldMinX+20) {
         player.moveTo(worldMinX+20, player.pos.y);
         return;
      }
      if (player.pos.x>worldMaxX-20) {
         player.moveTo(worldMaxX-20, player.pos.y);
         return;
      }
      if (player.pos.y < -fullHeight*2) {
         player.moveTo(player.pos.x, -fullHeight*2);
         return;
      }
      const topMargin = player.height * scale * 0.75;    // space between player and top of screen
      const bottomMargin = player.height * scale * 0.25; // space between player and bottom of screen
      const upFollowStart = player.height * scale;       // start following up sooner
      const targetY = player.pos.y < upFollowStart
         ? halfHeight + player.pos.y - player.height - topMargin
         : player.pos.y > groundMaxY + bottomMargin ? player.pos.y : halfHeight;
      const targetX = camMinX > camMaxX ? (worldMinX + worldMaxX) / 2 : clamp(player.pos.x, camMinX, camMaxX);
      const camDest = k.getCamPos().lerp(k.vec2(targetX, targetY), 0.08);
      k.setCamPos(camDest);
      // Parallax
      const parallaxBase = k.vec2(camDest.x - halfWidth, camDest.y - halfHeight);
      map.images.forEach(image => {
         const parallaxOffset = parallaxBase.scale(image.parallax);
         image.pos = image.originPos.add(parallaxOffset);
      });
   });
};
