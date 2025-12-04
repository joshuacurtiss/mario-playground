import k from '../../kaplayCtx';

const optionDefaults = {
   maxFlyTime: 4,
};

export function raccoon(options = optionDefaults) {
   const { maxFlyTime } = Object.assign({}, optionDefaults, options);
   const swipeSound = k.play('spin', { paused: true, loop: false });
   let _flyTime = 0;
   return {
      id: 'raccoon',
      require: [ 'pos', 'freeze' ],
      add() {
         this.onButtonPress('turbo', ()=>{
            // Never act if frozen or not raccoon power
            if (this.isFrozen || this.power!=='raccoon') return;
            // Raccoon should swipe when pressing turbo
            swipeSound.play(0);
            this.play(`swipe-${this.size}`, { loop: false, speed: 15 });
         });
         this.onButtonPress('jump', ()=>{
            // Never act if frozen or not raccoon power
            if (this.isFrozen || this.power!=='raccoon') return;
            // Raccoon flies if p-run, otherwise floats when "jumping" mid-air
            if (this.isPRunning && _flyTime<maxFlyTime) {
               swipeSound.play(0);
               this.play(`fly-${this.size}`, { loop: false });
               if (this.isGrounded()) _flyTime = 0;
               else this.vel.y = -750;
            } else {
               this.runTime = 0;
               _flyTime = 0;
               this.play(`wag-${this.size}`, { loop: false, speed: 12 });
               if (!this.isGrounded()) swipeSound.play(0);
            }
         });
         this.on('collect', (item)=>{
            if (item.type !== 'leaf') return;
            if (this.power === 'raccoon') {
               k.play('powerup');
               return;
            }
            k.play('transform');
            this.opacity = 0;
            this.add([
               k.sprite('items', { anim: 'poof' }),
               k.anchor('center'),
               k.pos(0, -this.area.shape.height/2),
               k.opacity(1),
               k.lifespan(0.6),
            ]);
            this.freeze(0.5, { onDone: ()=>{
               this.power = 'raccoon';
               this.opacity = 1;
            }});
         });
      },
      get flyTime() {
         return _flyTime;
      },
      fixedUpdate() {
         // Don't process movement if frozen
         if (this.isFrozen) return;
         const anim = this.curAnim() ?? '';
         // If wagging tail, slow down vertical velocity
         if (anim.startsWith('wag')) {
            if (this.isGrounded()) this.play(`walk-${this.size}`);
            else if (this.vel.y>0) this.vel.y *= 0.6;
         }
         // If flying, track fly time
         if (anim.startsWith('fly') && !this.isGrounded()) {
            _flyTime += k.dt();
         }
      },
   };
}
