import k, { debug, scale } from '../kaplayCtx';
import { BodyComp, GameObj, PosComp, Vec2 } from 'kaplay';
import makeMap, { convertPropertiesListToObj } from '../lib/map';
import { makeFadeIn, makeFadeOut } from '../ui/fader';
import { makeMario } from '../chars/mario';
import { isSingleDigit, makeHUD } from '../ui/hud';
import { GOOMBA_ENEMY_TAG, makeGoomba } from '../enemies/goomba';
import { Goal, GoalItem, isGoalItem, makeFireworks } from '../items/goal';

const fullWidth = k.width();
const fullHeight = k.height();
const halfWidth = fullWidth/2;
const halfHeight = fullHeight/2;

function clamp(v: number, min: number, max: number) {
   return Math.min(Math.max(v, min), max);
}

interface GameSceneOptions {
   world: number;
   level: number;
}

const gameSceneDefaultOptions: GameSceneOptions = {
   world: 1,
   level: 1,
};

export default async function(options: Partial<GameSceneOptions> = gameSceneDefaultOptions) {
   const { world, level } = Object.assign({}, gameSceneDefaultOptions, options);
   k.setGravity(3100);
   // Fade in
   makeFadeIn();
   // Load level and map data
   const mapJson = await fetch(`assets/levels/${world}-${level}.tmj`),
         mapData = await mapJson.json(),
         map = makeMap(mapData, k.vec2(0, -432), scale);

   map.generateTilesData();
   map.render();

   // Map properties
   const {
      music: musicPrefix,
      time: gameTime,
   } = convertPropertiesListToObj(map.mapData.properties);

   // Calculate ground and camera boundaries based on map data
   const groundObjects = map.mapData.layers.find((l: any) => l.name === 'colliders').objects.filter((o: any) => o.type === 'ground');
   const groundMinX = Math.min(...groundObjects.map((o: any) => o.x));
   const groundMaxX = Math.max(...groundObjects.map((o: any) => o.x + o.width));
   const groundMaxY = Math.max(...groundObjects.map((o: any) => o.y + o.height));
   const worldMinX = groundMinX * scale;
   const worldMaxX = groundMaxX * scale;
   const camMinX = worldMinX + halfWidth;
   const camMaxX = worldMaxX - halfWidth;

   /**
    * Calculates the desired camera destination based on an object's position (optionally, provide its
    * height, otherwise we assume 32px). This does not handle the interpolation for smooth movement,
    * just the raw target destination.
    */
   function calcCamDest(pos: Vec2, height: number = 32): Vec2 {
      const topMargin = height * scale * 0.75;    // space between player and top of screen
      const bottomMargin = height * scale * 0.25; // space between player and bottom of screen
      const upFollowStart = height * scale;       // start following up sooner
      const targetY = pos.y < upFollowStart
         ? halfHeight + pos.y - height - topMargin
         : pos.y > groundMaxY + bottomMargin ? pos.y : halfHeight;
      const targetX = camMinX > camMaxX ? (worldMinX + worldMaxX) / 2 : clamp(pos.x, camMinX, camMaxX);
      return k.vec2(targetX, targetY);
   }

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
   hud.world = isSingleDigit(world) ? world : 1;
   const endTime = Math.ceil(k.time()) + (gameTime ?? 300);
   hud.time = endTime - k.time();

   // Music
   const music = k.play(`${musicPrefix ?? 'ground'}-loop`, { paused: true, loop: true });
   const intro = k.play(`${musicPrefix ?? 'ground'}-intro`, { paused: true });
   intro.onEnd(() => music.play());
   k.wait(0.75, () => intro.play());
   const hurryTimer = k.wait(endTime-Math.ceil(k.time())-60, async ()=>{
      if (player.isFrozen) return;
      music.stop();
      await k.play('hurry-up');
      await k.wait(0.25);
      if (player.isFrozen) return;
      music.speed = 1.5;
      music.detune = -400;
      music.play();
   });

   // Player (move camera to spawn point first, in case the spawn is initially off-camera)
   const playerSpawnPos = k.choose(map.spawn.filter(s=>s.name === 'player' || s.name === 'mario')).pos;
   k.setCamPos(calcCamDest(playerSpawnPos));
   await k.wait(0); // Wait a tick to ensure the camera position is set before we spawn the player
   const player = makeMario(playerSpawnPos);
   player.on('die', () => {
      // Fade to black and go home
      hurryTimer.cancel();
      intro.stop();
      music?.stop();
      k.wait(5, () => makeFadeOut({ onDone: () => k.go('home') }));
   });
   player.on('coinsChanged', newCoins=>hud.coins = newCoins);
   player.on('livesChanged', newLives=>hud.lives = newLives);
   player.on('scoreChanged', newScore=>hud.score = newScore);
   player.on('prunCountChanged', newCount=>hud.pCount = newCount);
   player.on('prunningChanged', isPrunning=>hud.pDash = isPrunning);
   player.onCollide('die', () => {
      // When you collide with a 'die' collider, you always die, even if you're invulnerable.
      player.isInvulnerable = false;
      player.die();
   });
   player.on('starPowerChanged', (isActive: boolean) => {
      if (isActive) music?.stop();
      else if (!player.isFrozen) music?.play();
   });
   player.on('goal', async (goal: Goal) => {
      const goalItem = goal.getCurAnim()?.name;
      if (!isGoalItem(goalItem)) return;

      // Freeze the player, clear his movement, and set him walking to the right
      player.isFrozen = true;
      player.clearMovement();
      player.flipX = true;
      player.play(`walk-${player.size}`);
      player.unuse('offscreen');
      player.onFixedUpdate(()=>{
         if (player.pos.x > worldMaxX) return;
         player.moveBy(player.speeds.walk * k.dt(), 0);
      });

      // Turn off existing music/sound
      hurryTimer.cancel();
      music.stop();

      /**
       * The async UI process for collecting points for the remaining time.
       */
      const collectTimerPoints = async () => {
         while (hud.time > 0) {
            const multiplier = hud.time < 10 ? 1 : 10;
            hud.time -= 1 * multiplier;
            player.score += 50 * multiplier;
            k.play('score');
            await k.wait(0.01);
         }
         k.play('score-end');
      };

      /**
       * Instantiate a card for display on the ending screen.
       */
      const makeCard = (pos: Vec2, item: GoalItem) => {
         ui.add([
            k.sprite('ui-hud-cards'),
            k.pos(pos),
            k.scale(scale),
         ]);
         ui.add([
            k.sprite('hud-items', { anim: item, animSpeed: 0 }),
            k.pos(pos.add(3*scale, 5*scale)),
            k.scale(scale),
         ]);
      }

      const runGoalExit = async () => {
         ui.add([
            k.text('Course Clear!', { size: 32, align: 'center', width: fullWidth }),
            k.color(k.WHITE),
            k.pos(0, fullHeight*0.15),
         ]);
         ui.add([
            k.text('You got a card:', { size: 32, align: 'center', width: fullWidth * 0.9 }),
            k.color(k.WHITE),
            k.pos(0, fullHeight*0.3),
         ]);
         makeCard(k.vec2(fullWidth*0.6, fullHeight*0.3-8*scale), goalItem);
      };

      const runGoalExitWithFireworks = async () => {
         goal.onDestroy(()=>{
            makeFireworks(goal.pos.add(goal.width/2, 0), goalItem);
         });
         k.onFixedUpdate(()=>{
            if (!goal) return;
            const camDest = k.getCamPos().lerp(goal.pos.add(goal.width/2, fullHeight*0.15), 0.08);
            k.setCamPos(camDest);
         })
         await k.wait(2);
         ui.add([
            k.text('You got a card:', { size: 32, align: 'center', width: fullWidth * 0.9 }),
            k.color(k.WHITE),
            k.pos(0, fullHeight*0.7),
         ]);
         makeCard(k.vec2(fullWidth*0.6, fullHeight*0.7-8*scale), goalItem);
      };

      const threeCardMatch = hud.cards[0] === goalItem && hud.cards[1] === goalItem;
      const endMusic = threeCardMatch ? 'course-clear-fireworks' : 'course-clear';
      const endMusicDelay = threeCardMatch ? 0.25 : 2.25;
      k.play(endMusic);
      await k.wait(endMusicDelay, async ()=>{
         hud.addCard(goalItem);
         hud.flashCard(hud.cards.length-1);
         if (threeCardMatch) await runGoalExitWithFireworks();
         else await runGoalExit();
      });
      await k.wait(2);
      await collectTimerPoints();
      if (hud.cards.length === 3) {
         hud.flashCard(1);
         k.wait(0.5, () => hud.flashCard(0));
         const cnt = hud.cards.every(c => c === 'star') ? 5 :
            hud.cards.every(c => c === 'flower') ? 3 :
            hud.cards.every(c => c === 'mushroom') ? 2 : 1;
         // Show proper 1/2/3/5-up sprite based on cnt
         const livesText = ui.add([
            k.pos(halfWidth, fullHeight + 25 * scale),
            {
               fixedUpdate(this: GameObj<PosComp>) {
                  const livesTextTargetY = fullHeight * 0.63;
                  if (this.pos.y <= livesTextTargetY) return;
                  this.pos.y = Math.max(livesTextTargetY, this.pos.y - 1300 * k.dt());
               },
            },
         ]);
         livesText.add([
            k.sprite('text-lives', { anim: cnt.toString(), animSpeed: 0 }),
            k.pos(-8*scale, 0),
            k.anchor('center'),
            k.scale(scale),
         ]);
         livesText.add([
            k.sprite('text-lives', { anim: 'up', animSpeed: 0 }),
            k.pos(8*scale, 0),
            k.anchor('center'),
            k.scale(scale),
         ]);
         // Count up the lives, then wait a moment before exiting
         await k.loop(0.6, ()=>{
            player.lives += 1;
            k.play('1up');
         }, cnt);
      }
      await k.wait(3);
      // Exit level. TODO: This will need to become something more graceful then going 'home'.
      makeFadeOut({ onDone: () => {
         if (hud.cards.length === 3) hud.cards = [];
         music.stop();
         k.go('home');
      }});
   });
   hud.player = player.char;
   hud.lives = player.lives;
   hud.score = player.score;
   hud.coins = player.coins;
   hud.cards = ['star', 'star'];

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
      const camDest = k.getCamPos().lerp(calcCamDest(player.pos, player.height), 0.08);
      k.setCamPos(camDest);
      // Parallax
      const parallaxBase = k.vec2(camDest.x - halfWidth, camDest.y - halfHeight);
      map.images.forEach(image => {
         const parallaxOffset = parallaxBase.scale(image.parallax);
         image.pos = image.originPos.add(parallaxOffset);
      });
   });
};
