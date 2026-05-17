import { Enemy, isEnemy, isPiranha } from '../../enemies';
import { Headbuttable, isHeadbuttable } from '../../items';
import { Rect, Vec2 } from 'kaplay';
import { Char } from '..';
import k, { debug } from '../../kaplayCtx';
import { Comp } from 'kaplay';
import { isRect } from '../../lib/type-guards';

export interface RaccoonOpt {
   maxFlyTime: number;
}

const optionDefaults: RaccoonOpt = {
   maxFlyTime: 4,
};

export interface RaccoonComp extends Comp {
   get flyTime(): number;
}

export function raccoon(options: Partial<RaccoonOpt> = {}) {
   const { maxFlyTime } = Object.assign({}, optionDefaults, options);
   const swipeSound = k.play('spin', { paused: true, loop: false });
   let _flyTime = 0;

   // Swipe state and helpers
   let swipeHitEnemies: Enemy[] = [];
   let swipeHitHeadbuttables: Headbuttable[] = [];
   let swipeHitBoxes: Rect[] = [];

   function drawSwipeStrike(player: Char, targetPos: Vec2) {
      const charPos = player.worldPos();
      if (!charPos) return;
      k.add([
         k.sprite('items', { anim: 'strike', animSpeed: 2 }),
         k.scale(player.scale),
         k.anchor('center'),
         k.pos(charPos.x + 15*player.scale.x*(targetPos.x<charPos.x ? -1 : 1), charPos.y - 7*player.scale.y),
         k.opacity(1),
         k.lifespan(0.25),
      ]);
   }

   function handleSwipeEnemies(player: Char) {
      for (const enemy of k.get('enemy', { recursive: true })) {
         if (!isEnemy(enemy)) continue;
         if (enemy.isFrozen) continue;
         const enemyBounds = isPiranha(enemy) ? enemy.getVisibleRect() : enemy.worldArea().bbox();
         if (!enemyBounds) continue;
         if (!swipeHitBoxes.some(hitBox => hitBox.collides(enemyBounds))) continue;
         swipeHitEnemies.push(enemy);
         const enemyPos = enemy.worldPos();
         if (!enemyPos) continue;
         drawSwipeStrike(player, enemyPos);
         enemy.die(player);
      }
   }

   function handleSwipeHeadbuttables(player: Char) {
      if (swipeHitHeadbuttables.length>0) return;
      const charArea = player.worldArea().bbox();
      const charCenterX = charArea.pos.x + charArea.width / 2;
      const blocks = k.get('block', { recursive: true });
      const bricks = k.get('brick', { recursive: true });
      const headbuttables = [ ...blocks, ...bricks ].filter(isHeadbuttable);

      // Since we only allow player to swipe one headbuttable per swipe, we are careful to find the
      // "best" candidate based on facing direction, and who is closest.
      interface Candidate {
         obj: Headbuttable;
         dist: number;
         inFacingDir: boolean;
      }
      const candidates: Candidate[] = [];
      headbuttables.forEach(obj => {
         const targetBounds = obj.worldArea().bbox();
         if (!swipeHitBoxes.some(hitBox => hitBox.collides(targetBounds))) return;
         const targetCenterX = targetBounds.pos.x + targetBounds.width / 2;
         const dist = Math.abs(targetCenterX - charCenterX);
         const inFacingDir = player.flipX ? targetCenterX >= charCenterX : targetCenterX <= charCenterX;
         candidates.push({ obj, dist, inFacingDir });
      });
      if (!candidates.length) return;
      const preferred = candidates.filter(candidate => candidate.inFacingDir);
      const pool = preferred.length ? preferred : candidates;
      const target = pool.reduce((best, candidate)=>candidate.dist < best.dist ? candidate : best);

      // Finish up by triggering headbutt, drawing strike, and adding to hit list to prevent multiple hits
      swipeHitHeadbuttables.push(target.obj);
      target.obj.trigger('headbutted', player);
      const targetPos = target.obj.worldPos();
      if (targetPos) drawSwipeStrike(player, targetPos);
   }
   return {
      id: 'raccoon',
      require: [ 'pos', 'freeze' ],
      add(this: Char) {
         this.onButtonPress('turbo', ()=>{
            // Never act if frozen or not raccoon power
            if (this.isFrozen || this.power!=='raccoon') return;
            // Raccoon should swipe when pressing turbo
            swipeSound.play(0);
            this.play(`swipe-${this.size}`, { loop: false, speed: 15 });
         });
         this.onButtonPress('jump', ()=>{
            // Never act if frozen or not raccoon power
            if (this.isFrozen || this.power!=='raccoon') return;
            // First jump from ground should be a normal jump. Raccoon behavior
            // (wag/fly) only starts on a follow-up jump press while airborne.
            if (this.isGrounded()) {
               _flyTime = 0;
               return;
            }
            // Raccoon flies if p-run, otherwise floats when "jumping" mid-air
            if (this.isPRunning() && _flyTime<maxFlyTime) {
               swipeSound.play(0);
               this.play(`fly-${this.size}`, { loop: false });
               this.vel.y = -750;
            } else {
               this.runTime = 0;
               _flyTime = 0;
               this.play(`wag-${this.size}`, { loop: false, speed: 12 });
               swipeSound.play(0);
            }
         });
         this.on('collect', (item)=>{
            if (item.type !== 'leaf') return;
            if (this.power === 'raccoon') {
               k.play('powerup');
               return;
            }
            k.play('transform');
            this.opacity = 0;
            const rect = this.area.shape && isRect(this.area.shape) ? this.area.shape : new k.Rect(k.vec2(0,0),0,0);
            this.add([
               k.sprite('items', { anim: 'poof' }),
               k.anchor('center'),
               k.pos(0, -rect.height/2),
               k.opacity(1),
               k.lifespan(0.6),
            ]);
            this.freeze(0.5, { onDone: ()=>{
               this.power = 'raccoon';
               this.opacity = 1;
            }});
         });

         // For debugging: Draw swipe hit boxes
         if (debug) {
            const drawSwipeHitBoxes = k.onDraw(() => {
               swipeHitBoxes.forEach(hitBox => {
                  k.drawRect({
                     ...hitBox,
                     color: k.YELLOW,
                     fill: true,
                     opacity: 0.3,
                  });
               });
            });
            this.onDestroy(() => drawSwipeHitBoxes.cancel());
         }
      },
      get flyTime() {
         return _flyTime;
      },
      fixedUpdate(this: Char) {
         // Don't process movement if frozen or if not raccoon power
         if (this.isFrozen || this.power !== 'raccoon') return;
         const anim = this.curAnim() ?? '';
         // If wagging tail, slow down vertical velocity
         if (anim.startsWith('wag')) {
            if (this.isGrounded()) this.play(`walk-${this.size}`);
            else if (this.vel.y>0) this.vel.y *= 0.44;
         }
         // If flying, track fly time
         if (anim.startsWith('fly') && !this.isGrounded()) {
            _flyTime += k.dt();
         }
         // Swipe logic: Calculate swipe hit boxes and check for enemy/headbuttable collisions
         if (anim.startsWith('swipe')) {
            const charArea = this.worldArea().bbox();
            const swipeY = charArea.pos.y + charArea.height*0.6;
            swipeHitBoxes = [
               new k.Rect(k.vec2(charArea.pos.x - charArea.width, swipeY), charArea.width, charArea.height*0.3),
               new k.Rect(k.vec2(charArea.pos.x + charArea.width, swipeY), charArea.width, charArea.height*0.3),
            ];
            handleSwipeEnemies(this);
            handleSwipeHeadbuttables(this);
         } else {
            swipeHitEnemies = [];
            swipeHitHeadbuttables = [];
            swipeHitBoxes = [];
         }
      },
   };
}
