import k, { scale } from "../kaplayCtx";
import { makeIndicator } from "../ui/indicator";
import { points } from '../shared-abilities/points';

const optionDefaults = {
   char: 'goomba',
   debugText: null,
   flying: false,
   dir: 1,
   boundaryLeft: 0,
   boundaryRight: 1250 * scale,
   points: 100,
};

export function makeGoomba(pos, options = optionDefaults) {
   const opts = Object.assign({}, optionDefaults, options);
   const { boundaryLeft, boundaryRight, char } = opts;
   let { dir } = opts;
   let alive = true;
   const speed = 25 * scale;
   const jumpForce = 1200;
   let i=0;
   let frozen = false;
   // TODO: Support `flying` goomba
   // TODO: Add debug text (`debugText`) support
   return k.add([
      k.sprite('enemies', { anim: char }),
      k.scale(0.975 * scale),
      k.area({
         shape: new k.Rect(k.vec2(0, -1), 14, 15),
         collisionIgnore: [ 'coin' ],
      }),
      k.anchor('bot'),
      k.pos(pos),
      k.body({ jumpForce }),
      k.offscreen({ distance: 10000, destroy: true }),
      points(opts.points),
      {
         add() {
            k.onFixedUpdate(()=>{
               if (!alive || frozen) return;
               this.move(speed * dir, 0);
               if (!this.isGrounded()) return;
               if (this.pos.x<boundaryLeft && dir<0) dir = 1;
               if (this.pos.x>boundaryRight && dir>0) dir = -1;
            });
            this.onBeforePhysicsResolve(col=>{
               if (!alive || frozen) return;
               // Ignore collision with other enemies when they fall on top of each other.
               if (col.target.is('enemy') && col.isBottom()) col.preventResolution();
            });
            this.onCollideUpdate((obj, col)=>{
               if (!alive || frozen || obj.is('player')) return;
               if ((col.isLeft() && dir<0) || (col.isRight() && dir>0)) {
                  // If a block triggers a collision by just a few pixels vertically, ignore it.
                  if (obj.is('block-or-brick') && Math.abs(obj.pos.y-this.pos.y) < 10) return;
                  dir *= -1;
               }
            });
            this.onHeadbutted(this.headbutted);
         },
         freeze(duration) {
            if (frozen) return;
            const anim = this.curAnim();
            this.isStatic = true;
            this.vel = k.vec2(0, 0);
            this.stop();
            frozen = true;
            k.wait(duration, ()=>{
               frozen = false;
               this.isStatic = false;
               this.play(anim);
            });
         },
         get isAlive() {
            return alive;
         },
         set isAlive(val) {
            alive = val;
         },
         collect() {
            this.trigger('die');
            this.stop();
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            alive = false;
            if (this.points) makeIndicator(this.pos.sub(0, this.area.shape.height*this.scale.y-this.area.shape.pos.y*this.scale.y), { msg: this.points });
         },
         headbutted(player) {
            if (player) player.trigger('collect', this);
            this.flipY = true;
         },
         die(player) {
            if (player) player.trigger('collect', this);
            this.vel = k.vec2(0, -175*scale);
            this.flipY = true;
            k.play('hit');
            k.wait(3, () => {
               this.destroy();
            });
         },
         squash(player) {
            if (player) player.trigger('collect', this);
            this.vel = k.vec2(0, 0);
            this.isStatic = true;
            this.play(`${char}-die`);
            k.play('stomp');
            k.wait(0.5, () => {
               this.destroy();
            });
         }
      },
      'enemy',
      'goomba',
   ]);
};
