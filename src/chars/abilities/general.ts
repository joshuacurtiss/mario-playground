import k, { scale } from '../../kaplayCtx';
import { Collision, Comp, GameObj, Rect } from 'kaplay';
import { Char } from '../index';
import { Enemy, isEnemy } from '../../enemies';
import { isRect } from '../../lib/type-guards';
import { CollectibleItem } from '../../items';

export const powers = [ 'normal', 'fire', 'raccoon' ] as const;
export type Power = typeof powers[number];
export function isPower(val: string): val is Power {
   return (powers as unknown as string[]).includes(val);
}

export const sizes = [ 'sm', 'lg' ] as const;
export type Size = typeof sizes[number];
export function isSize(val: string): val is Size {
   return (sizes as unknown as string[]).includes(val);
}

export const charNames = [ 'mario' ] as const;
export type CharName = typeof charNames[number];
export function isCharName(val: string): val is CharName {
   return (charNames as unknown as string[]).includes(val);
}

// Constants
const powersWithoutSmallSprites: Power[] = [ 'raccoon' ];

export interface GeneralCompOpt {
   speeds: {
      walk: number;
      turbo: number;
      prun: number;
      dec: number;
      inc: number;
   },
   jumpForces: {
      sm: number;
      lg: number;
   },
   areas: {
      duck: Rect;
      swipe: Rect;
      sm: Rect;
      lg: Rect;
   },
   prunThreshold: number;
   size: Size;
}

// Defaults are for Mario
const optionDefaults: GeneralCompOpt = {
   speeds: {
      walk: 87,
      turbo: 150,
      prun: 175,
      dec: 5,
      inc: 7
   },
   jumpForces: {
      sm: 1300,
      lg: 1350
   },
   areas: {
      duck: new k.Rect(k.vec2(0), 10, 16),
      swipe: new k.Rect(k.vec2(0), 24, 27),
      sm: new k.Rect(k.vec2(0), 10, 15),
      lg: new k.Rect(k.vec2(0), 13, 27),
   },
   prunThreshold: 1.2,
   size: 'sm',
};

export interface GeneralComp extends Comp {
   get size(): Size;
   set size(val: Size);
   get char(): CharName;
   set char(val: CharName);
   get power(): Power;
   set power(val: Power);
   get runTime(): number;
   set runTime(val: number);
   get debug(): string;
   getControls(): {
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
      leftOrRight: boolean;
      upOrDown: boolean;
      turbo: boolean;
   };
   isPRunning(): boolean;
   getSprite(): string;
   setSprite(newSprite: string): void;
   updateAreaRect(): void;
   die(): void;
   hurt(): void;
   handleCollideEnemy(enemy: Enemy, col?: Collision): void;
   handleCollideCollectible(item: GameObj, col?: Collision): void;
   handleCollectItem(item: CollectibleItem): void;
   handlePhysics(col: Collision): void;
   handleJump(): void;
}

export function general(options: Partial<GeneralCompOpt> = {}): GeneralComp {
   const opts = Object.assign({}, optionDefaults, options);
   let { size: _size } = opts;
   const { areas, jumpForces, prunThreshold } = opts;
   const skidSound = k.play('skid', { paused: true, loop: true, speed: 0.9, volume: 0.6 });
   const runSound = k.play('p-meter', { paused: true, loop: true });
   const speeds = { ...opts.speeds };
   (Object.keys(speeds) as (keyof GeneralCompOpt['speeds'])[]).forEach(key => speeds[key] *= scale);
   let lastPos = k.vec2(0);
   let lastPRunCount = 0;
   let lastPRunning = false;
   let _debug = '';
   let _runTime = 0;
   let momentum = 0;
   let jumpCombo = 0;
   return {
      id: 'general',
      require: [ 'pos', 'area', 'freeze', 'invulnerable', 'star' ],
      get size() {
         return _size;
      },
      set size(val) {
         // If small, can only be normal power
         if (val==='sm' && this.power!=='normal') this.power = 'normal';
         _size = val;
      },
      get char() {
         const charName = this.getSprite().split('-')[0];
         return isCharName(charName) ? charName : 'mario';
      },
      set char(val) {
         this.setSprite(`${val}-${this.power}`);
         // Some powers can't be small because they don't have the sprites
         if (powersWithoutSmallSprites.includes(this.power) && this.size==='sm') this.size = 'lg';
      },
      get power() {
         const power = this.getSprite().split('-')[1];
         return isPower(power) ? power : 'normal';
      },
      set power(val) {
         this.setSprite(`${this.char}-${val}`);
         // Some powers can't be small because they don't have the sprites
         if (powersWithoutSmallSprites.includes(val) && this.size==='sm') this.size = 'lg';
      },
      get runTime() {
         return _runTime;
      },
      set runTime(val) {
         _runTime = val;
      },
      getControls(this: Char) {
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
      isPRunning(this: Char) {
         const c = this.getControls();
         return c.turbo && _runTime>=prunThreshold && (c.leftOrRight || !this.isGrounded());
      },
      get debug() {
         return _debug;
      },
      getSprite(this: Char): string {
         return this.sprite;
      },
      setSprite(this: Char, newSprite: string) {
         if (this.sprite === newSprite) return;
         const { flipX, frame } = this;
         this.use(k.sprite(newSprite, { frame, flipX }));
      },
      updateAreaRect(this: Char) {
         let rect = areas.lg;
         const anim = this.curAnim() ?? '';
         if (anim.startsWith('duck')) rect = areas.duck;
         else if (anim.startsWith('swipe')) rect = areas.swipe;
         else if (this.size === 'sm') rect = areas.sm;
         if (
            !this.area.shape ||
            !isRect(this.area.shape) ||
            !rect.pos.eq(this.area.shape.pos) ||
            rect.width !== this.area.shape.width ||
            rect.height !== this.area.shape.height
         ) {
            this.area.shape = rect.clone();
         }
      },
      die(this: Char) {
         if (this.isFrozen || this.isInvulnerable) return;
         this.trigger('die');
         this.size = 'sm'; // Size is always small on death
         this.freeze(2.6, { onDone: ()=>{
            this.isFrozen = true;
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            this.play(`die-${this.size}`);
            this.jump(jumpForces.lg);
         }});
         this.z = 1000;
         runSound.stop();
         skidSound.stop();
         k.play('die');
         this.play(`die-${this.size}`);
         this.opacity = 1;
         this.scaleBy(1.2);
      },
      hurt(this: Char) {
         if (this.isInvulnerable) return;
         this.trigger('hurt');
         if (this.size==='sm') {
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
            // For these powers, transform with a poof
            k.play('transform');
            const shape = this.area.shape && isRect(this.area?.shape) ? this.area.shape : new k.Rect(k.vec2(0,0),0,0);
            this.add([
               k.sprite('items', { anim: 'poof' }),
               k.anchor('center'),
               k.pos(0, -shape.height/2),
               k.opacity(1),
               k.lifespan(0.6),
            ]);
         } else {
            // Other powers: Just play hurt sound
            k.play('hurt');
         }
      },
      handleCollideEnemy(this: Char, enemy, _col) {
         if (this.isFrozen || enemy.isFrozen) return;
         const charRect = this.area.shape && isRect(this.area.shape) ? this.area.shape : new k.Rect(k.vec2(0),0,0);
         const enemyRect = enemy.area.shape && isRect(enemy.area.shape) ? enemy.area.shape : new k.Rect(k.vec2(0),0,0);
         // Must hit top part of enemy  with downward velocity to squash
         const thresholdY = enemy.pos.y - enemyRect.pos.y - enemyRect.height / 2;
         // But star power comes first. Enemy just dies with no bounce if star power.
         if (this.hasStarPower) {
            enemy.die(this);
         } else if ((this.pos.y <= thresholdY) && this.vel.y > 0) {
            jumpCombo = jumpCombo ? jumpCombo * 2 : 1;
            enemy.points *= jumpCombo;
            if (enemy.isOneUp) this.oneUp();
            enemy.squash(this);
            // We wait a tick to bounce in case we squash multiple enemies in one frame
            k.wait(0, ()=>{
               if (this.isJumping()) return;
               this.variableJump(jumpForces[this.size]*1.1);
            });
         } else if (this.curAnim()?.startsWith('swipe') && enemy.pos.y > this.pos.y - charRect.height/2) {
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
      handleCollideCollectible(this: Char, item, col) {
         col?.preventResolution();
         if (this.isFrozen) return;
         this.trigger('collect', item);
      },
      handleCollectItem(this: Char, item) {
         this.score += item.points;
         item.collect();
      },
      handlePhysics(col) {
         // There's only special logic for touching enemies
         if (isEnemy(col.target)) {
            col.preventResolution();
            this.handleCollideEnemy(col.target, col);
         }
      },
      handleJump(this: Char) {
         // Never act if frozen
         if (this.isFrozen) return;
         // Any other case, only jump if grounded
         if (!this.isGrounded()) return;
         k.play('jump');
         // Implement jump force based on momentum and run state
         let jumpForce = jumpForces[_size];
         if (k.isButtonDown('turbo') && momentum) jumpForce *= 1.1;
         if (this.isPRunning()) jumpForce *= 1.1;
         this.variableJump(jumpForce);
      },
      add(this: Char) {
         this.onBeforePhysicsResolve(this.handlePhysics);
         this.onButtonPress('jump', this.handleJump);
         this.onCollide('coin', this.handleCollideCollectible);
         this.onCollide('powerup', this.handleCollideCollectible);
         this.on('collect', this.handleCollectItem);
      },
      fixedUpdate(this: Char) {
         // Don't process movement if frozen
         if (this.isFrozen) return;
         // Update area rectangle based on current state
         this.updateAreaRect();
         // Controls
         const c = this.getControls();
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
         const prunning = this.isPRunning();
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
            // If they're not moving (maybe there's an obstacle) though, don't build momentum
            if (Math.abs(momentum)>speeds.inc && !moving) momentum = 0;
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
         // Debug text
         _debug = `Character: ${this.char} (${this.power}, ${this.size})\n`+
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
      },
   };
}
