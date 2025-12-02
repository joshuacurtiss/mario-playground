import k, { scale } from "../kaplayCtx";
import variableJump from "./abilities/variable-jump";
import { coins } from "./abilities/coins";
import { fireball } from './abilities/fireball';
import { flash } from './abilities/flash';
import { invulnerable } from './abilities/invulnerable';
import { lives } from "./abilities/lives";
import { raccoon } from './abilities/raccoon';
import { score } from "./abilities/score";
import { star } from './abilities/star';
import { freeze } from '../shared-abilities/freeze';

const powersWithoutSmallSprites = [ 'raccoon' ];

const optionDefaults = {
   char: 'mario',
   power: 'normal',
   debugText: null,
   size: 'sm',
};

export function makeMario(pos, options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   const { char, power, debugText } = opts;
   let { size: _size } = opts;
   const prunThreshold = 1.2;
   const speeds = { walk: 87*scale, turbo: 150*scale, prun: 175*scale, dec: 5*scale, inc: 7*scale };
   const jumpForces = { sm: 1300, lg: 1350 };
   const skidSound = k.play('skid', { paused: true, loop: true, speed: 0.9, volume: 0.6 });
   const runSound = k.play('p-meter', { paused: true, loop: true });
   let lastPos = pos.clone();
   let lastPRunCount = 0;
   let lastPRunning = false;
   let _runTime = 0;
   let momentum = 0;
   let jumpCombo = 0;
   return k.add([
      k.sprite(`${char}-${power}`, { frame: 0, flipX: true }),
      k.scale(scale),
      k.area(),
      k.anchor('bot'),
      k.pos(pos),
      k.body(),
      k.z(1),
      k.offscreen({ distance: 7*scale }),
      coins(),
      fireball(),
      flash(),
      invulnerable(),
      lives(),
      raccoon(),
      score(),
      star(),
      freeze(),
      variableJump(),
      'player',
      {
         updateAreaRect() {
            let rect;
            const anim = this.curAnim() ?? '';
            if (anim.startsWith('duck')) rect = new k.Rect(k.vec2(0, 0), 10, 16);
            else if (anim.startsWith('swipe')) rect = new k.Rect(k.vec2(0, 0), 24, 27);
            else if (this.size === 'sm') rect = new k.Rect(k.vec2(0, 0), 10, 15);
            else rect = new k.Rect(k.vec2(0, 0), 13, 27);
            if (
               !this.area.shape?.pos ||
               !rect.pos.eq(this.area.shape.pos) ||
               rect.width !== this.area.shape.width ||
               rect.height !== this.area.shape.height
            ) {
               this.area.shape = rect;
            }
         },
         die() {
            if (this.isFrozen || this.isInvulnerable) return;
            this.trigger('die');
            this.size = 'sm'; // Size is always small on death
            this.freeze(2.6, { onDone: ()=>{
               this.isFrozen = true;
               this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
               this.play(`die-${_size}`);
               this.jump(jumpForces.lg);
            }});
            this.z = 1000;
            runSound.stop();
            skidSound.stop();
            k.play('die');
            this.play(`die-${_size}`);
            this.opacity = 1;
            this.scaleBy(1.2);
         },
         get size() {
            return _size;
         },
         set size(val) {
            // If small, can only be normal power
            if (val==='sm' && this.power!=='normal') this.power = 'normal';
            _size = val;
         },
         get char() {
            return this.sprite.split('-')[0];
         },
         get power() {
            return this.sprite.split('-')[1];
         },
         get runTime() {
            return _runTime;
         },
         set runTime(val) {
            _runTime = val;
         },
         setSprite(newSprite) {
            if (this.sprite === newSprite) return;
            const { flipX, frame } = this;
            this.use(k.sprite(newSprite, { frame, flipX }));
         },
         set char(val) {
            this.setSprite(`${val}-${this.power}`);
            // Some powers can't be small because they don't have the sprites
            if (powersWithoutSmallSprites.includes(this.power) && this.size==='sm') this.size = 'lg';
         },
         set power(val) {
            this.setSprite(`${this.char}-${val}`);
            // Some powers can't be small because they don't have the sprites
            if (powersWithoutSmallSprites.includes(val) && this.size==='sm') this.size = 'lg';
         },
         grow() {
            if (this.isFrozen) return;
            k.play('powerup');
            if (_size==='lg') return;
            this.freeze(1, { onDone: ()=>{
               this.stop();
               this.vel = this.vel.scale(1.1);
               this.size = 'lg';
            }});
            this.play('grow', { speed: 20 });
         },
         hurt() {
            if (this.isInvulnerable) return;
            this.trigger('hurt');
            if (_size==='sm') {
               this.die();
               return;
            }
            this.invulnerable(2.5);
            this.freeze(0.5, { onDone: ()=>this.power = 'normal' });
            if (this.power === 'normal') {
               // When normal, player shrinks
               k.play('hurt');
               this.play('grow', { speed: 20 });
               k.wait(0.5, ()=>{ this.size = 'sm' });
            } else if (['raccoon', 'frog', 'hammer', 'tanooki'].includes(this.power)) {
               // Raccoon, frog, hammer, tanooki: Transform with a poof
               k.play('transform');
               this.add([
                  k.sprite('items', { anim: 'poof' }),
                  k.anchor('center'),
                  k.pos(0, -this.area.shape.height/2),
                  k.opacity(1),
                  k.lifespan(0.6),
               ]);
            } else {
               // Other powers (like fire): Just play hurt sound
               k.play('hurt');
            }
         },
         handleCollideEnemy(enemy, col) {
            if (this.isFrozen || enemy.isFrozen) return;
            // Must hit top part of enemy  with downward velocity to squash
            const thresholdY = enemy.pos.y - enemy.area.shape.pos.y - enemy.area.shape.height / 2;
            // But star power comes first. Enemy just dies with no bounce if star power.
            if (this.hasStarPower) {
               enemy.die(this);
            } else if ((this.pos.y <= thresholdY) && this.vel.y > 0) {
               jumpCombo = !jumpCombo ? 1 : jumpCombo * 2;
               enemy.points *= jumpCombo;
               if (enemy.isOneUp) this.oneUp();
               enemy.squash(this);
               // We wait a tick to bounce in case we squash multiple enemies in one frame
               k.wait(0, ()=>{
                  if (this.isJumping()) return;
                  this.variableJump(jumpForces[_size]*1.1);
               });
            } else if (this.curAnim()?.startsWith('swipe') && enemy.pos.y > this.pos.y - this.area.shape.height/2) {
               k.add([
                  k.sprite('items', { anim: 'strike', animSpeed: 2 }),
                  k.scale(this.scale),
                  k.anchor('center'),
                  k.pos(this.pos.x + 15*this.scale.x*(enemy.pos.x<this.pos.x ? -1 : 1), this.pos.y - 7*this.scale.y),
                  k.opacity(1),
                  k.lifespan(0.25),
               ])
               enemy.die(this);
            } else if (!this.isInvulnerable) {
               enemy.freeze(0.7);
               this.hurt();
            }
         },
         handleCollideCollectible(item, col) {
            col.preventResolution();
            if (this.isFrozen) return;
            this.trigger('collect', item);
         },
         add() {
            this.onButtonPress('jump', ()=>{
               // Never act if frozen
               if (this.isFrozen) return;
               // Any other case, only jump if grounded
               if (!this.isGrounded()) return;
               k.play('jump');
               // Implement jump force based on momentum and run state
               let jumpForce = jumpForces[_size];
               if (k.isButtonDown('turbo') && momentum) jumpForce *= 1.1;
               if (this.isPRunning) jumpForce *= 1.1;
               this.variableJump(jumpForce);
            });
            this.onBeforePhysicsResolve(col=>{
               // There's only special logic for touching enemies
               if (col.target.is('enemy')) {
                  col.preventResolution();
                  this.handleCollideEnemy(col.target, col);
               }
            });
            this.onCollide('coin', this.handleCollideCollectible);
            this.onCollide('powerup', this.handleCollideCollectible);
            this.on('collect', (item)=>{
               const origPower = this.power;
               this.score += item.points;
               if (item.is('coin') || item.is('coinpop')) {
                  this.coins += 1;
               } else if (item.type === 'mushroom') {
                  this.grow();
               } else if (item.type === '1up') {
                  this.oneUp();
               } else if (item.type === 'flower') {
                  this.power = 'fire';
                  if (this.size==='lg') k.play('powerup');
                  else this.grow();
                  if (origPower!=='fire') this.flash(0.9, { invert: false });
               }
               item.collect();
            });
            this.on('1up', this.oneUp);
         },
         get controls() {
            // Up/down take priority unless you're mid-jump
            const up = this.isGrounded() && k.isButtonDown('up');
            const down = !up && k.isButtonDown('down');
            const upOrDown = up || down;
            const right = !upOrDown && k.isButtonDown('right');
            const left = !upOrDown && !right && k.isButtonDown('left');
            const leftOrRight = left || right;
            const turbo = k.isButtonDown('turbo');
            return { up, down, left, right, leftOrRight, upOrDown, turbo };
         },
         get isPRunning() {
            const c = this.controls;
            return c.turbo && _runTime>=prunThreshold && (c.leftOrRight || !this.isGrounded());
         },
         fixedUpdate() {
            // Don't process movement if frozen
            if (this.isFrozen) return;
            // Update area rectangle based on current state
            this.updateAreaRect();
            // Controls
            const c = this.controls;
            const skidding = (c.left && momentum>0) || (c.right && momentum<0);
            const lastPosDelta = Math.round(this.pos.dist(lastPos));
            const moving = lastPosDelta>0;
            // If running, track run time. You don't get credit while jumping.
            let runtimeMultiplier = c.turbo && c.leftOrRight && !skidding && this.isGrounded() ? 1 : -1.2;
            if (skidding || !moving) runtimeMultiplier = -4; // Take runtime credits away faster when skidding
            if (!this.isGrounded() && _runTime===prunThreshold) runtimeMultiplier = 0; // Hold p-run state while in air
            _runTime += k.dt() * runtimeMultiplier;
            if (_runTime<0) _runTime = 0;
            else if (_runTime>prunThreshold) _runTime = prunThreshold;
            // Reset jump combo if we touch the ground
            if (this.isGrounded()) jumpCombo = 0;
            // Check for p-run
            const prunning = this.isPRunning;
            const prunCount = Math.ceil(_runTime*6 / prunThreshold);
            if (prunCount!==lastPRunCount) {
               lastPRunCount = prunCount;
               this.trigger('prunCountChanged', prunCount);
            }
            if (prunning !== lastPRunning) {
               lastPRunning = prunning;
               this.trigger('prunningChanged', prunning);
            }
            const maxSpeed = prunning ? speeds.prun : c.turbo ? speeds.turbo : speeds.walk;
            // Play sound effects
            if (prunning && runSound.paused) runSound.play();
            else if (!prunning && !runSound.paused) runSound.stop();
            if (skidding && this.isGrounded() && skidSound.paused) skidSound.play();
            else if (!skidding && !skidSound.paused) skidSound.stop();
            // Handle momentum build up and decay
            if (!c.leftOrRight) {
               // Decay momentum
               const momentumDir = momentum>0 ? 1 : -1;
               momentum -= speeds.dec * momentumDir;
               // Only slow down to zero, don't reverse when decaying
               if ((momentumDir>0 && momentum<0) || (momentumDir<0 && momentum>0)) momentum=0;
            } else {
               const goDir = c.left ? -1 : 1;
               // If mid-air, you can change direction a little faster (1.75x)
               momentum += speeds.inc * goDir * (this.isGrounded() ? 1 : 1.75);
               const momentumDir = momentum>0 ? 1 : -1;
               // TODO: If you let go of turbo mid-jump, this stops them too fast mid-air.
               if (Math.abs(momentum)>maxSpeed) momentum = maxSpeed * momentumDir;
            }
            let anim = 'idle';
            let animSpeed = momentum ? Math.abs(momentum)/maxSpeed * (c.turbo ? 3 : 1.2) : 1;
            if (prunning && this.isGrounded()) anim = 'run';
            else if (prunning) anim = (this.hasStarPower && _size==='lg') ? 'somersault' : 'pjump';
            else if (!this.isGrounded()) anim = (this.hasStarPower && _size==='lg') ? 'somersault' : 'jump';
            else if (skidding) anim = 'skid';
            else if (c.down) anim = 'duck';
            else if (moving) anim = 'walk';
            else if (this.isGrounded() && c.up && this.power !== 'raccoon') anim = 'lookup';
            // Do not interrupt certain animations until they're done. If they are set to not loop,
            // when they are done `curAnim()` will report as `null`.
            const doNotInterruptAnims = [ 'fly', 'swipe', 'throw', 'wag' ];
            const curAnimRoot = (this.curAnim() ?? '').split('-')[0];
            if (doNotInterruptAnims.includes(curAnimRoot)) {
               // Do not change animation or speed until current is done
               anim = curAnimRoot;
               animSpeed = 1;
            }
            anim += '-' + _size;
            if (anim.startsWith('somersault')) animSpeed *= 3;
            // Actually apply calculations to the characters
            lastPos = this.pos.clone();
            if (this.animSpeed!==animSpeed) this.animSpeed = animSpeed;
            if (this.hasAnim(anim) && this.curAnim()!==anim) this.play(anim);
            if (momentum) {
               this.flipX = momentum>0;
               this.move(momentum, 0);
            }
            // Debug text display
            if (debugText) {
               debugText.text = `Character: ${this.char} (${this.power}, ${this.size})\n`+
                  `Score: ${this.score}\n`+
                  `Coins: ${this.coins}\n`+
                  `Lives: ${this.lives}\n`+
                  `Pos: ${this.pos.x.toFixed(0)}, ${this.pos.y.toFixed(0)} (Delta: ${lastPosDelta})\n`+
                  `Momentum: ${momentum.toFixed(0)}\n`+
                  `Run Time: ${this.runTime.toFixed(2)}s\n`+
                  `Fly Time: ${this.flyTime.toFixed(2)}s\n`+
                  `P-Meter: ${'>'.repeat(prunCount) + (prunning ? ' P' : '')}\n`+
                  `Skidding: ${skidding}\n`+
                  `Anim: ${this.curAnim()} (${this.animSpeed.toFixed(1)}x)`;
            }
         },
      },
   ]);
}