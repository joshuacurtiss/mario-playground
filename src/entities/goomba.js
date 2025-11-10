import k from "../kaplayCtx";

const optionDefaults = {
   char: 'goomba',
   debugText: null,
   flying: false,
   dir: 1,
   boundaryLeft: 0,
   boundaryRight: 5000,
};

export function makeGoomba(pos, options = optionDefaults) {
   let { char, boundaryLeft, boundaryRight, dir } = Object.assign({}, optionDefaults, options);
   let alive = true;
   const speed = 100;
   const jumpForce = 1200;
   let i=0;
   let frozen = false;
   // TODO: Support `flying` goomba
   // TODO: Add debug text (`debugText`) support
   return k.add([
      k.sprite('enemies', { anim: char }),
      k.scale(3.9),
      k.area({
         shape: new k.Rect(k.vec2(0, -1), 14, 15),
         collisionIgnore: [ 'coin' ],
      }),
      k.anchor('bot'),
      k.pos(pos),
      k.body({ jumpForce }),
      k.offscreen({ distance: 10000, destroy: true }),
      {
         add() {
            k.onUpdate(()=>{
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
         headbutted() {
            this.trigger('die');
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            alive = false;
            this.stop();
            this.flipY = true;
         },
         squash() {
            this.trigger('die');
            this.vel = k.vec2(0, 0);
            this.isStatic = true;
            this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
            alive = false;
            k.play('stomp');
            this.play(`${char}-die`);
            k.wait(0.5, () => {
               this.destroy();
            });
         }
      },
      'enemy',
      'goomba',
   ]);
};
