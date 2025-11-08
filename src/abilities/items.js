const optionDefaults = {
   emptyAnim: 'block-empty', // Animation to switch to when empty
}

export function items(items, options = {}) {
   const itemArray = [];
   const { emptyAnim } = Object.assign({}, optionDefaults, options);
   let nextItem, revealingItem;
   return {
      id: 'items',
      require: [ 'sprite', 'pos', 'area', 'bump' ],

      get itemsEmpty() {
         return itemArray.length===0;
      },
      get items() {
         return itemArray;
      },
      get nextItem() {
         return itemArray[itemArray.length - 1];
      },
      pushItem(obj) {
         itemArray.push(obj);
         this.packItem(obj);
      },
      popItem() {
         const item = itemArray.pop();
         if (itemArray.length===0) this.trigger('itemsEmpty');
         return item;
      },
      packItem(obj) {
         obj.pos = obj.pos.add(32, 8);
         obj.scale = obj.scale.scale(0.1);
         obj.opacity = 0;
         obj.paused = true;
      },
      unpackItem(obj) {
         obj.pos = this.pos.clone();
         obj.scale = obj.scale.scale(10);
         obj.paused = false;
         obj.opacity = 1;
      },
      add() {
         if (items) (Array.isArray(items) ? items : [items]).forEach(item=>this.pushItem(item));
         if (this.itemsEmpty) this.trigger('itemsEmpty');
         this.on('bump', dir=>{
            if (nextItem || revealingItem) return;
            if (this.itemsEmpty) return;
            const item = this.nextItem;
            if (!item.is('coinpop') && !item.is('powerup')) return;
            nextItem = this.popItem();
            item.dir = dir;
            // Coin pops reveal immediately, popups reveal after bump completes
            if (item.is('coinpop')) {
               this.unpackItem(item);
               item.reveal(item.pos.sub(0, this.height*this.scale.y));
            }
         });
         this.on('bumpDone', ()=>{
            if (!revealingItem && !nextItem) return;
            revealingItem = nextItem;
            nextItem = null;
            if (!revealingItem.is('powerup')) {
               revealingItem = null;
               return;
            }
            this.unpackItem(revealingItem);
            revealingItem.reveal();
            revealingItem.on('revealDone', ()=>revealingItem = null);
            revealingItem.onDestroy(()=>revealingItem = null);
         });
         this.on('itemsEmpty', ()=>{
            if (this.curAnim()!==emptyAnim) this.play(emptyAnim);
         });
      },
  };
}
