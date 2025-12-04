import k, { scale } from '../kaplayCtx';
import type { AreaComp, GameObj, SpriteComp, PosComp, BodyComp, ScaleComp, Vec2, Comp, ZComp, Collision } from 'kaplay';
import { points, PointsComp } from '../shared-abilities/points';
import { makeIndicator } from '../ui/indicator';

export type PowerupType = 'mushroom' | 'flower' | 'leaf' | 'star' | '1up';
export type Dir = -1 | 1;

export type Powerup = GameObj<SpriteComp & PosComp & BodyComp & AreaComp & ScaleComp & ZComp & PointsComp & PowerupComp>;

export interface PowerupOpt {
   type: PowerupType;
   points?: number; // Points awarded when revealed
   reveal?: boolean; // Whether to reveal immediately upon creation
}

const optionDefaults: PowerupOpt = {
   type: 'mushroom',
   points: 1000,
   reveal: false,
};

export type PowerupCompOpt = Omit<PowerupOpt, 'points'>;
const { type, reveal } = optionDefaults;
const compOptionDefaults: PowerupCompOpt = { type, reveal };

export interface PowerupComp extends Comp {
   get isRevealed(): boolean;
   getIsRevealed(): boolean;
   get type(): PowerupType;
   set type(val: PowerupType);
   setType(val: PowerupType): void;
   get dir(): Dir;
   set dir(newDir: Dir);
   setDir(newDir: Dir): void;
   reveal(): void;
   collect(): void;
   postReveal(): void;
}

export function isPowerup(obj?: GameObj): obj is Powerup {
   return typeof obj !== 'undefined' && obj.has('powerup');
}

export function powerup(options: Partial<PowerupCompOpt> = {}): PowerupComp {
   const speed = 50 * scale;
   const opts = Object.assign({}, compOptionDefaults, options);
   let { type: _type } = opts;
   let _dir: Dir = k.randi() ? 1 : -1;
   let revealHeight: number;
   return {
      id: 'powerup',
      require: [ 'sprite', 'pos', 'body', 'scale', 'points' ],
      get isRevealed() {
         return this.getIsRevealed();
      },
      getIsRevealed(this: Powerup) {
         return this.isStatic===false;
      },
      get type() {
         return _type;
      },
      set type(val) {
         this.setType(val);
      },
      setType(this: Powerup, val: PowerupType) {
         _type = val;
         this.play(_type);
      },
      get dir() {
         return _dir;
      },
      set dir(newDir) {
         this.setDir(newDir);
      },
      setDir(this: Powerup, newDir: Dir) {
         _dir = newDir;
         // Set proper direction, if already moving
         this.vel.x = Math.abs(this.vel.x) * _dir;
      },
      reveal(this: Powerup) {
         k.play('powerup-appears');
         this.tag('revealing');
         // Remove gravity so we can do the reveal
         this.gravityScale = 0;
         // We must remove static here so that player can collide with it while it is revealing
         this.isStatic = false;
      },
      collect(this: Powerup) {
         if (this.points) {
            makeIndicator(this.pos.sub(0, this.height), { msg: this.points.toFixed(0) });
         }
         this.destroy();
      },
      postReveal(this: Powerup) {
         this.untag('revealing');
         this.trigger('revealDone');
         this.gravityScale = 1;
         // Allow collisions with blocks again, because now it revealed
         this.collisionIgnore = this.collisionIgnore.filter(ci=>ci!=='block-or-brick');
         // Specific powerup behaviors
         if (_type === 'mushroom' || _type === '1up') {
            this.vel = k.vec2(speed*this.dir, 0);
         } else if (_type === 'leaf') {
            this.collisionIgnore.push('block-or-brick');
            this.collisionIgnore.push('ground');
            this.gravityScale = 0;
            this.z = 5;
            const leafStartFalling = k.time() + 0.05;
            this.onFixedUpdate(()=>{
               if (k.time() < leafStartFalling) return;
               this.gravityScale = 1;
               this.vel.x = 45 * scale * Math.sin(k.time() * 3);
               this.flipX = this.vel.x > 0;
               this.applyImpulse(k.vec2(0, Math.abs(this.vel.x) * -0.4));
            });
         } else if (_type === 'star') {
            const starVertSpeed = -175 * scale;
            this.gravityScale = 0.5;
            this.vel = k.vec2(speed*this.dir, starVertSpeed);
            this.onGround(()=>this.vel.y = starVertSpeed);
         }
      },
      fixedUpdate(this: Powerup) {
         if (this.is('revealing')) {
            this.moveBy(0, -2.5 * (_type === 'leaf' ? 2*this.pos.y/revealHeight : 1));
            // Stop ignoring player collisions once 0.25 revealed
            if (this.pos.y <= revealHeight + (this.height * scale * 0.75)) {
               this.collisionIgnore = this.collisionIgnore.filter(ci=>ci!=='player');
            }
            // Finish reveal once at final height
            if (this.pos.y <= revealHeight) {
               this.pos.y = revealHeight;
               this.postReveal();
            }
         }
         // Destroy if falls out of world
         if (this.pos.y > 2500*scale) {
            k.destroy(this);
         }
      },
      add(this: Powerup) {
         // Calculate reveal height
         revealHeight = this.pos.y - 16 * scale * (_type === 'leaf' ? 3.25 : 1);
         // 1up doesn't have points
         if (_type === '1up') this.points = 0;
         // Change direction when bumping into things
         const handleCollide = (obj: GameObj, col?: Collision)=>{
            if (!obj.is('block-or-brick')) {
               col?.preventResolution();
               return;
            }
            if (col?.normal.x && col.hasOverlap()) {
               this.dir = this.dir<0 ? 1 : -1;
            }
         };
         this.onCollide('block-or-brick', handleCollide);
         this.onCollideUpdate(handleCollide);
         // Leaf has different collision area
         if (_type === 'leaf') {
            this.area.shape = new k.Rect(k.vec2(2, 2), 12, 12);
         }
         // Reveal immediately if specified
         if (opts.reveal) this.reveal();
      },
   };
}

export function makePowerup(pos: Vec2, options: Partial<PowerupOpt> = {}): Powerup {
   const opts = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: opts.type, animSpeed: opts.type==='star' ? 2 : 1 }),
      k.pos(pos),
      k.body({ isStatic: true, maxVelocity: opts.type === 'leaf' ? 175 : undefined }),
      k.area({ collisionIgnore: [ 'powerup', 'coin', 'coinpop', 'enemy', 'block-or-brick', 'player' ] }),
      k.scale(scale),
      k.z(-1),
      points(opts.points),
      powerup(options),
      'powerup',
      `powerup-${opts.type}`,
      opts.type,
   ]);
}
