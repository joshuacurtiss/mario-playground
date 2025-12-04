import k from '../../kaplayCtx';
import { AnchorComp, AreaComp, BodyComp, Collision, Comp, GameObj, OffScreenComp, PosComp, ScaleComp, SpriteComp } from 'kaplay';
import { Char } from '../index';
import { isEnemy } from '../../enemies';
import { isRect } from '../../lib/type-guards';
import { CollectibleItem } from '../../items';
import { isPowerup } from '../../items/powerup';

let fireballs: Fireball[] = [];

interface BouncingFireballComp extends Comp {
   get player(): Char;
}

type Fireball = GameObj<SpriteComp & ScaleComp & AreaComp & PosComp & AnchorComp & BodyComp & OffScreenComp & BouncingFireballComp>;

function isFireball(obj?: GameObj): obj is Fireball {
   return !!obj && obj.has(['bouncingFireball', 'sprite', 'area', 'pos', 'body']);
}

function bouncingFireball(player: Char): BouncingFireballComp {
   const dir = player.flipX ? 1 : -1;
   function makeExplosion(fireball: Fireball) {
      k.add([
         k.sprite('items', { anim: 'poof', animSpeed: 2 }),
         k.scale(fireball.scale),
         k.pos(fireball.pos),
         k.anchor('center'),
         k.opacity(1),
         k.lifespan(0.2),
      ]);
   }
   function handleBlockCollision(_obj: GameObj, col?: Collision) {
      if (!col) return;
      if (col.normal.y < 0) {
         // Bounce off block/ground
         col.source.vel.y = -700;
      } else if (isFireball(col.source)) {
         // But hitting from side or top causes explosion
         makeExplosion(col.source);
         col.source.destroy();
         k.play('bump-block');
      }
   }
   function handleEnemyCollision(enemy: GameObj, col?: Collision) {
      if (!isEnemy(enemy)) return;
      col?.preventResolution();
      if (enemy.isFrozen) return;
      enemy.die(col?.source.player);
      if (isFireball(col?.source)) makeExplosion(col.source);
      col?.source.destroy();
   }
   return {
      id: 'bouncingFireball',
      require: [ 'pos', 'area' ],
      add(this: Fireball) {
         this.vel = k.vec2(700*dir, 200);
         this.onCollide('enemy', handleEnemyCollision);
         this.onCollide('block-or-brick', handleBlockCollision);
         this.onCollide('ground', handleBlockCollision);
      },
      destroy(this: Fireball) {
         fireballs = fireballs.filter(f=>f.id!==this.id)
      },
      get player() {
         return player;
      },
   };
}

function makeFireball(player: Char): Fireball {
   const dir = player.flipX ? 1 : -1;
   const scaleX = player.scale.x;
   const scaleY = player.scale.y;
   const shape = player.area.shape && isRect(player.area?.shape) ? player.area.shape : new k.Rect(k.vec2(0,0),0,0);
   return k.add([
      k.sprite('enemies', { anim: 'fireball', flipX: !player.flipX }),
      k.scale(player.scale),
      k.area({
         collisionIgnore: [ 'player', 'powerup', 'coin', 'coinpop' ],
         shape: new k.Rect(k.vec2(0,0),6,6),
      }),
      k.pos(player.pos.add((3+shape.pos.x)*scaleX*dir + shape.width*scaleX/2*dir, -shape.height*scaleY/2)),
      k.anchor('center'),
      k.body(),
      k.offscreen({ destroy: true }),
      bouncingFireball(player),
      'fireball',
   ]);
}

export interface FireballOpt {
   max: number;
}

const optionDefaults: FireballOpt = {
   max: 2,
};

export interface FireballComp extends Comp {
   get fireballCount(): number;
   get fireballMaxed(): boolean;
}

export function fireball(options: Partial<FireballOpt> = {}): FireballComp {
   const { max } = Object.assign({}, optionDefaults, options);
   return {
      id: 'fireball',
      require: [ 'pos', 'flash', 'freeze' ],
      get fireballCount() {
         return fireballs.length;
      },
      get fireballMaxed() {
         return fireballs.length >= max;
      },
      add(this: Char) {
         this.onButtonPress('turbo', ()=>{
            if (this.isFrozen) return;
            if (this.power==='fire') {
               // Limit number of fireballs on screen
               if (this.fireballMaxed) return;
               k.play('fireball');
               this.play(`throw-${this.size}`, { loop: false });
               fireballs.push(makeFireball(this));
            }
         });
         this.on('collect', (item: CollectibleItem) => {
            if (!isPowerup(item) || item.type !== 'flower') return false;
            const origPower = this.power;
            this.power = 'fire';
            if (this.size==='lg') k.play('powerup');
            else this.grow();
            if (origPower!=='fire') this.flash(0.9, { invert: false });
         });
      },
   };
}
