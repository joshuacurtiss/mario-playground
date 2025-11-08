import k from '../kaplayCtx';

export function breaks() {
   return {
      id: 'breaks',
      require: [ 'sprite', 'pos', 'body' ],
      add() {
         this.onHeadbutted(obj=>{
            // Only respond to player headbutts
            if (!obj.is('player')) return;
            if (obj.size !== 'lg') return;
            // If it is an "empty" sprite, do not bump. We handle it this way because some things like
            // a note block or a brick can be bumped when empty. But a `block-empty` never will.
            if (this.curAnim().endsWith('empty')) return;
            this.break();
         });
      },
      break() {
         this.trigger('break');
         const anim = this.curAnim().replace('brick', 'brickbreak');
         for ( let i=0 ; i<4 ; i++ ) {
            const piece = k.add([
               k.sprite('items', { anim }),                             // 0 2 <-- i%2==0
               k.pos(this.pos.add(i<2 ? 16 : 48, i%2 ? 16 : 48)),       // 1 3 <-- i%2==1
               k.body({ gravityScale: 1.3 }),
               k.anchor('center'),
               k.scale(4),
               k.opacity(1),
               k.lifespan(1.25, { fade: 0.5 }),
            ]);
            piece.applyImpulse(k.vec2((i<2 ? -1 : 1) * (i%2 ? 200 : 250), i%2 ? -1400 : -800));
         }
         k.play('brick-break');
         this.destroy();
      },
  };
}
