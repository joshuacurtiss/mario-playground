import k, { scale } from "../kaplayCtx";
import variableJump from "./abilities/variable-jump";
import { coins } from "./abilities/coins";
import { fireball } from './abilities/fireball';
import { lives } from "./abilities/lives";
import { score } from "./abilities/score";
import { makeIndicator } from "../ui/indicator";

const powersWithoutSmallSprites = [ 'raccoon' ];

const optionDefaults = {
   char: 'mario',
   power: 'normal',
   debugText: null,
   size: 'sm',
};

k.loadShader('invert', null, `
   uniform float u_time;
   vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
      vec4 c = def_frag();
      float t = (sin(u_time * 15.0) + 1.0) / 2.0;
      return mix(c, vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, c.a), t);
   }
`);

export function makeMario(pos, options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   const { char, power, debugText } = opts;
   let { size: _size } = opts;
   const prunThreshold = 1.2;
   const speeds = { walk: 87*scale, turbo: 150*scale, prun: 175*scale, dec: 5*scale, inc: 7*scale };
   const jumpForces = { sm: 1300, lg: 1350 };
   const skidSound = k.play('skid', { paused: true, loop: true, speed: 0.9, volume: 0.6 });
   const runSound = k.play('p-meter', { paused: true, loop: true });
   const swipeSound = k.play('spin', { paused: true, loop: false });
   let alive = true;
   let invulnerable = false;
   let flashing = false;
   let frozen = false;
   let starPower = false;
   let lastPos = pos.clone();
   let lastPRunCount = 0;
   let lastPRunning = false;
   let runTime = 0;
   let flyTime = 0;
   let momentum = 0;
   let jumpCombo = 0;
   function makePlayerAreaRect(options = {}) {
      const { ducking, swiping } = Object.assign({}, { ducking: false, swiping: false }, options);
      if (ducking) return new k.Rect(k.vec2(0, 0), 10, 16);
      if (swiping) return new k.Rect(k.vec2(0, 0), 24, 27);
      if (_size === 'sm') return new k.Rect(k.vec2(0, 0), 10, 15);
      return new k.Rect(k.vec2(0, 0), 13, 27);
   }
   return k.add([
      k.sprite(`${char}-${power}`, { frame: 0, flipX: true }),
      k.scale(scale),
      k.area({ shape: makePlayerAreaRect() }),
      k.anchor('bot'),
      k.pos(pos),
      k.body(),
      k.z(1),
      k.offscreen({ distance: 7*scale }),
      coins(),
      fireball(),
      lives(),
      score(),
      variableJump(),
      'player',
      {
         die() {
            if (!alive || invulnerable) return;
            this.trigger('die');
            this.size = 'sm'; // Size is always small on death
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            alive = false;
            this.z = 1000;
            runSound.stop();
            skidSound.stop();
            k.play('die');
            this.play(`die-${_size}`);
            this.opacity = 1;
            this.scaleBy(1.2);
            k.wait(2.6, () => {
               this.isStatic = false;
               this.jump(jumpForces.lg);
            });
         },
         get size() {
            return _size;
         },
         set size(val) {
            // If small, can only be normal power
            if (val==='sm' && this.power!=='normal') this.power = 'normal';
            _size = val;
            this.area.shape = makePlayerAreaRect();
         },
         get char() {
            return this.sprite.split('-')[0];
         },
         get power() {
            return this.sprite.split('-')[1];
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
         get isAlive() {
            return alive;
         },
         get isFrozen() {
            return frozen;
         },
         get isInvulnerable() {
            return invulnerable;
         },
         set isInvulnerable(val) {
            invulnerable = val;
         },
         grow() {
            if (!alive || frozen) return;
            k.play('powerup');
            if (_size==='lg') return;
            frozen = true;
            const vel = this.vel.clone();
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            this.play('grow', { speed: 20 });
            k.wait(1, ()=>{
               this.stop();
               this.isStatic = false;
               frozen = false;
               this.vel = vel.scale(1.1);
               this.size = 'lg';
            });
         },
         hurt() {
            if (invulnerable) return;
            this.trigger('hurt');
            if (_size==='sm') {
               this.die();
               return;
            }
            invulnerable = true;
            frozen = true;
            const vel = this.vel.clone();
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            k.wait(2.5, ()=>invulnerable = false);
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
            // When done hurting, unfreeze player and restore velocity
            k.wait(0.5, ()=>{
               this.power = 'normal';
               this.isStatic = false;
               this.vel = vel.scale(0.9);
               frozen = false;
            });
         },
         oneUp() {
            this.lives += 1;
            k.play('1up');
            makeIndicator(this.pos.sub(0, this.area.shape.height*this.scale.y-this.area.shape.pos.y*this.scale.y), { sprite: 'ui-1up' });
         },
         handleCollideEnemy(enemy, col) {
            if (!alive || frozen || !enemy.isAlive) return;
            // Must hit top part of enemy  with downward velocity to squash
            const thresholdY = enemy.pos.y - enemy.area.shape.pos.y - enemy.area.shape.height / 2;
            // But star power comes first. Enemy just dies with no bounce if star power.
            if (starPower) {
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
            } else if (!invulnerable) {
               enemy.freeze(0.7);
               this.hurt();
            }
         },
         handleCollideCollectible(item, col) {
            col.preventResolution();
            if (!this.isAlive) return;
            this.trigger('collect', item);
         },
         add() {
            this.onButtonPress('turbo', ()=>{
               // Never act if not alive or frozen
               if (!alive || frozen) return;
               // Raccoon should swipe tail when turbo is pressed
               if (this.power!=='raccoon') return;
               swipeSound.play(0);
               this.play(`swipe-${_size}`, { loop: false, speed: 15 });
               this.area.shape = makePlayerAreaRect({ swiping: true });
            });
            this.onButtonPress('jump', ()=>{
               // Never act if not alive or frozen
               if (!alive || frozen) return;
               // Raccoon should float when "jumping" in mid-air
               if (this.power==='raccoon') {
                  if (runTime>=prunThreshold && flyTime<4) {
                     swipeSound.play(0);
                     this.play(`fly-${_size}`, { loop: false });
                     if (this.isGrounded()) flyTime = 0;
                     else this.vel.y = -750;
                  } else {
                     runTime = 0;
                     flyTime = 0;
                     this.play(`wag-${_size}`, { loop: false, speed: 12 });
                     if (!this.isGrounded()) swipeSound.play(0);
                  }
               }
               // Any other case, only jump if grounded
               if (!this.isGrounded()) return;
               k.play('jump');
               // Implement jump force based on momentum and run state
               let jumpForce = jumpForces[_size];
               if (k.isButtonDown('turbo') && momentum) jumpForce *= 1.1;
               if (runTime>=prunThreshold) jumpForce *= 1.1;
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
               } else if (item.type === 'star') {
                  starPower = true;
                  this.trigger('starPowerChanged', starPower);
                  flashing = true;
                  this.use(k.shader("invert", ()=>({ "u_time": k.time() })));
                  k.wait(8, ()=>{
                     this.unuse('shader');
                     flashing = false;
                     starPower = false;
                     this.trigger('starPowerChanged', starPower);
                  });
               } else if (item.type === 'leaf') {
                  if (this.power === 'raccoon') {
                     k.play('powerup');
                  } else {
                     k.play('transform');
                     this.opacity = 0;
                     frozen = true;
                     const vel = this.vel.clone();
                     this.isStatic = true;
                     this.vel = k.vec2(0, 0);
                     this.add([
                        k.sprite('items', { anim: 'poof' }),
                        k.anchor('center'),
                        k.pos(0, -this.area.shape.height/2),
                        k.opacity(1),
                        k.lifespan(0.6),
                     ]);
                     k.wait(0.5, ()=>{
                        frozen = false;
                        this.power = 'raccoon';
                        this.opacity = 1;
                        this.isStatic = false;
                        this.vel = vel;
                     });
                  }
               } else if (item.type === 'flower') {
                  this.power = 'fire';
                  if (this.size==='lg') k.play('powerup');
                  else this.grow();
                  if (origPower!=='fire') {
                     flashing = true;
                     k.wait(0.9, ()=>flashing = false);
                  }
               }
               item.collect();
            });
            this.on('1up', this.oneUp);
            this.onFixedUpdate(()=>{
               // Don't process if dead
               if (!alive) return;
               // Invulnerability
               if (invulnerable) {
                  this.opacity = k.wave(0.2, 0.8, k.time() * 75);
               } else if (this.opacity!==1 && this.opacity>0) {
                  this.opacity = 1;
               }
               // Flashing (usually after powerup)
               if (flashing) {
                  const t = k.time() * 30;
                  this.color = k.rgb(
                     k.wave(128, 255, t),
                     k.wave(128, 255, t + 2),
                     k.wave(128, 255, t + 4),
                  );
               } else {
                  this.color = k.rgb(255, 255, 255);
               }
               // Don't process movement if frozen
               if (frozen) return;
               // If wagging tail, slow down vertical velocity
               if (this.curAnim()?.startsWith('wag')) {
                  if (this.isGrounded()) this.play(`walk-${_size}`);
                  else if (this.vel.y>0) this.vel.y *= 0.6;
               } else if (this.curAnim()?.startsWith('fly') && !this.isGrounded()) {
                  flyTime += k.dt();
               }
               // Up/down take priority unless you're mid-jump
               const goUp = this.isGrounded() && k.isButtonDown('up');
               const goDown = !goUp && k.isButtonDown('down');
               const goRight = !goUp && !goDown && k.isButtonDown('right');
               const goLeft = !goUp && !goDown && !goRight && k.isButtonDown('left');
               const goLeftOrRight = goLeft || goRight;
               const goTurbo = k.isButtonDown('turbo');
               const skidding = (goLeft && momentum>0) || (goRight && momentum<0);
               const lastPosDelta = Math.round(this.pos.dist(lastPos));
               const moving = lastPosDelta>0;
               // If running, track run time. You don't get credit while jumping.
               let runtimeMultiplier = goTurbo && goLeftOrRight && !skidding && this.isGrounded() ? 1 : -1.2;
               if (skidding || !moving) runtimeMultiplier = -4; // Take runtime credits away faster when skidding
               if (!this.isGrounded() && runTime===prunThreshold) runtimeMultiplier = 0; // Hold p-run state while in air
               runTime += k.dt() * runtimeMultiplier;
               if (runTime<0) runTime = 0;
               else if (runTime>prunThreshold) runTime = prunThreshold;
               // Reset jump combo if we touch the ground
               if (this.isGrounded()) jumpCombo = 0;
               // Check for p-run
               const prunning = goTurbo && runTime>=prunThreshold && (goLeftOrRight || !this.isGrounded());
               const prunCount = Math.ceil(runTime*6 / prunThreshold);
               if (prunCount!==lastPRunCount) {
                  lastPRunCount = prunCount;
                  this.trigger('prunCountChanged', prunCount);
               }
               if (prunning !== lastPRunning) {
                  lastPRunning = prunning;
                  this.trigger('prunningChanged', prunning);
               }
               const maxSpeed = prunning ? speeds.prun : goTurbo ? speeds.turbo : speeds.walk;
               // Play sound effects
               if (prunning && runSound.paused) runSound.play();
               else if (!prunning && !runSound.paused) runSound.stop();
               if (skidding && this.isGrounded() && skidSound.paused) skidSound.play();
               else if (!skidding && !skidSound.paused) skidSound.stop();
               // Handle momentum build up and decay
               if (!goLeftOrRight) {
                  // Decay momentum
                  const momentumDir = momentum>0 ? 1 : -1;
                  momentum -= speeds.dec * momentumDir;
                  // Only slow down to zero, don't reverse when decaying
                  if ((momentumDir>0 && momentum<0) || (momentumDir<0 && momentum>0)) momentum=0;
               } else {
                  const goDir = goLeft ? -1 : 1;
                  // If mid-air, you can change direction a little faster (1.75x)
                  momentum += speeds.inc * goDir * (this.isGrounded() ? 1 : 1.75);
                  const momentumDir = momentum>0 ? 1 : -1;
                  // TODO: If you let go of turbo mid-jump, this stops them too fast mid-air.
                  if (Math.abs(momentum)>maxSpeed) momentum = maxSpeed * momentumDir;
               }
               let anim = 'idle';
               let animSpeed = momentum ? Math.abs(momentum)/maxSpeed * (goTurbo ? 3 : 1.2) : 1;
               if (prunning && this.isGrounded()) anim = 'run';
               else if (prunning) anim = (starPower && _size==='lg') ? 'somersault' : 'pjump';
               else if (!this.isGrounded()) anim = (starPower && _size==='lg') ? 'somersault' : 'jump';
               else if (skidding) anim = 'skid';
               else if (goDown) anim = 'duck';
               else if (moving) anim = 'walk';
               else if (this.isGrounded() && goUp && this.power !== 'raccoon') anim = 'lookup';
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
               if (this.hasAnim(anim) && this.curAnim()!==anim) {
                  this.play(anim);
                  // Support changing player area when anim changes.
                  this.area.shape = makePlayerAreaRect({ ducking: anim.startsWith('duck') });
               }
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
                     `Run Time: ${runTime.toFixed(2)}s\n`+
                     `Fly Time: ${flyTime.toFixed(2)}s\n`+
                     `P-Meter: ${'>'.repeat(prunCount) + (prunning ? ' P' : '')}\n`+
                     `Skidding: ${skidding}\n`+
                     `Anim: ${this.curAnim()} (${this.animSpeed.toFixed(1)}x)`;
               }
            });
         },
      },
   ]);
}