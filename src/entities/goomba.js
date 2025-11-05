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
      k.offscreen({ distance: 25 }),
      {
         add() {
            k.onUpdate(()=>{
               if (!alive || frozen) return;
               this.move(speed * dir, 0);
               if (!this.isGrounded()) return;
               if (this.pos.x<boundaryLeft && dir<0) dir = 1;
               if (this.pos.x>boundaryRight && dir>0) dir = -1;
            });
            this.onCollideUpdate((obj, col)=>{
               if (!alive || frozen || obj.is('player')) return;
               if ((col.isLeft() && dir<0) || (col.isRight() && dir>0)) dir *= -1;
            });
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
