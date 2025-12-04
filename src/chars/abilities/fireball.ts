import k from '../../kaplayCtx';

let fireballs = [];

function makeExplosion(fireball) {
   k.add([
      k.sprite('items', { anim: 'poof', animSpeed: 2 }),
      k.scale(fireball.scale),
      k.pos(fireball.pos),
      k.anchor('center'),
      k.opacity(1),
      k.lifespan(0.2),
   ]);
}

function handleBlockCollision(_, col) {
   if (col.normal.y < 0) {
      // Bounce off block/ground
      col.source.vel.y = -700;
   } else {
      // But hitting from side or top causes explosion
      makeExplosion(col.source);
      col.source.destroy();
      k.play('bump-block');
   }
}

function handleEnemyCollision(enemy, col) {
   col.preventResolution();
   if (enemy.isFrozen) return;
   enemy.die(col.source.player);
   makeExplosion(col.source);
   col.source.destroy();
}

function makeFireball(player) {
   const dir = player.flipX ? 1 : -1;
   const scaleX = player.scale.x;
   const scaleY = player.scale.y;
   const fb = k.add([
      k.sprite('enemies', { anim: 'fireball', flipX: !player.flipX }),
      k.scale(player.scale),
      k.area({
         collisionIgnore: [ 'player', 'powerup', 'coin', 'coinpop' ],
         shape: new k.Rect(k.vec2(0,0),6,6),
      }),
      k.pos(player.pos.add((3+player.area.shape.pos.x)*scaleX*dir + player.area.shape.width*scaleX/2*dir, -player.area.shape.height*scaleY/2)),
      k.anchor('center'),
      k.body(),
      k.offscreen({ destroy: true }),
      'fireball',
   ]);
   fb.player = player;
   fb.vel = k.vec2(700*dir, 200);
   fb.onCollide('enemy', handleEnemyCollision);
   fb.onCollide('block-or-brick', handleBlockCollision);
   fb.onCollide('ground', handleBlockCollision);
   fb.onDestroy(()=>fireballs=fireballs.filter(f=>f.id!==fb.id));
   return fb;
}

const optionDefaults = {
   max: 2,
};

export function fireball(options = {}) {
   const { max } = Object.assign({}, optionDefaults, options);
   return {
      id: 'fireball',
      require: [ 'pos', 'flash', 'freeze' ],
      add() {
         this.onButtonPress('turbo', ()=>{
            if (this.isFrozen) return;
            if (this.power==='fire') {
               // Limit number of fireballs on screen
               if (fireballs.length >= max) return;
               k.play('fireball');
               this.play(`throw-${this.size}`, { loop: false });
               fireballs.push(makeFireball(this));
            }
         });
         this.on('collect', (item) => {
            if (item.type !== 'flower') return false;
            const origPower = this.power;
            this.power = 'fire';
            if (this.size==='lg') k.play('powerup');
            else this.grow();
            if (origPower!=='fire') this.flash(0.9, { invert: false });
         });
      },
   };
}
