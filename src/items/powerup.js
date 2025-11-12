import k from '../kaplayCtx';
import { points } from '../abilities/points';
import { makeIndicator } from '../ui/indicator';

const optionDefaults = {
   type: 'mushroom', // 'mushroom' | 'flower' | 'leaf' | 'frog' | 'hammer' | 'star' | '1up' | 'tanooki'
   points: 1000, // Points awarded when revealed
   reveal: false, // Whether to reveal immediately upon creation
};

export function makePowerup(pos, options = {}) {
   const opts = Object.assign({}, optionDefaults, options);
   let { type: _type } = opts;
   let _dir = k.randi() ? 1 : -1;
   const scale = 4;
   const speed = 200;
   const revealHeight = pos.y - 16 * scale * (_type === 'leaf' ? 4 : 1);
   return k.add([
      k.sprite('items', { anim: _type }),
      k.pos(pos),
      k.body({ isStatic: true }),
      k.area({ collisionIgnore: [ 'powerup', 'coin', 'coinpop', 'enemy', 'block-or-brick', 'player' ] }),
      k.scale(scale),
      points(opts.points),
      'powerup',
      `powerup-${_type}`,
      _type,
      {
         get isRevealed() {
            return this.isStatic===false;
         },
         get type() {
            return _type;
         },
         set type(val) {
            _type = val;
            this.play(_type);
         },
         get dir() {
            return _dir;
         },
         set dir(newDir) {
            _dir = newDir;
            // Set proper direction, if already moving
            this.vel.x = Math.abs(this.vel.x) * _dir;
         },
         reveal() {
            k.play('powerup-appears');
            this.tag('revealing');
            // Remove gravity so we can do the reveal
            this.gravityScale = 0;
            // We must remove static here so that player can collide with it while it is revealing
            this.isStatic = false;
         },
         collect() {
            makeIndicator(this.pos.sub(0, this.height), this.points);
            k.destroy(this);
         },
         postReveal() {
            this.untag('revealing');
            this.trigger('revealDone');
            this.gravityScale = 1;
            // Allow collisions with blocks again, because now it revealed
            this.collisionIgnore = this.collisionIgnore.filter(ci=>ci!=='block-or-brick');
            // Specific powerup behaviors
            if (_type === 'mushroom' || _type === '1up') {
               this.vel = k.vec2(speed*this.dir, 0);
            }
            // TODO: Handle bouncing 'star'
            // TODO: Handle floating 'leaf'
            // All other types just sit still.
         },
         update() {
            if (this.is('revealing')) {
               this.moveBy(0, -1.25);
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
            if (this.pos.y > 10000) {
               k.destroy(this);
            }
         },
         add() {
            // Change direction when bumping into things
            const handleCollide = (obj, col)=>{
               if (col.normal.x) {
                  if (!col.hasOverlap()) return;
                  this.dir = -this.dir;
               }
            };
            this.onCollide('block-or-brick', handleCollide);
            this.onCollideUpdate('block-or-brick', handleCollide);
            // Reveal immediately if specified
            if (opts.reveal) this.reveal();
         },
      }
   ]);
}
