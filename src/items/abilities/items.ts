import k, { scale } from '../../kaplayCtx';
import type { Comp, GameObj } from 'kaplay';
import { isCoinPop } from '../coinpop';
import { Dir, isPowerup } from '../powerup';
import { HeadbuttableComps, HeadbuttableItem } from '../index';
import { Char } from '../../chars';

export interface ItemsOpt {
   emptyAnim: string; // Animation to switch to when empty
}

const optionDefaults: ItemsOpt = {
   emptyAnim: 'block-empty',
}

export interface ItemComp extends Comp {
   get itemsEmpty(): boolean;
   get items(): HeadbuttableItem[];
   get nextItem(): HeadbuttableItem | undefined;
   pushItem(obj: HeadbuttableItem): void;
   popItem(): HeadbuttableItem | undefined;
   packItem(obj: HeadbuttableItem): void;
   unpackItem(obj: HeadbuttableItem): void;
}

type HeadbuttableWithItems = GameObj<HeadbuttableComps & ItemComp>;

export function items(items: HeadbuttableItem | HeadbuttableItem[], options: Partial<ItemsOpt> = {}): ItemComp {
   const itemArray: HeadbuttableItem[] = [];
   const { emptyAnim } = Object.assign({}, optionDefaults, options);
   let nextItem: HeadbuttableItem | undefined, revealingItem: HeadbuttableItem | undefined;
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
      popItem(this: HeadbuttableWithItems) {
         const item = itemArray.pop();
         if (itemArray.length===0) this.trigger('itemsEmpty');
         return item;
      },
      packItem(obj: HeadbuttableItem) {
         obj.pos = obj.pos.add(k.vec2(8, 2).scale(scale));
         obj.scale = obj.scale.scale(0.1);
         obj.paused = true;
      },
      unpackItem(this: HeadbuttableWithItems, obj: HeadbuttableItem) {
         obj.pos = this.pos.clone();
         obj.scale = obj.scale.scale(10);
         obj.paused = false;
      },
      add(this: HeadbuttableWithItems) {
         if (items) (Array.isArray(items) ? items : [items]).forEach(item=>this.pushItem(item));
         if (this.itemsEmpty) this.trigger('itemsEmpty');
         this.on('bump', (dir: Dir, bumper: Char)=>{
            if (nextItem || revealingItem) return;
            if (this.itemsEmpty) return;
            const item = this.nextItem;
            if (!isCoinPop(item) && !isPowerup(item)) return;
            nextItem = this.popItem();
            if (isPowerup(item)) item.dir = dir;
            // Coin pops reveal immediately, powerups reveal after bump is done
            if (isCoinPop(item)) {
               this.unpackItem(item);
               bumper.trigger('collect', item);
               item.reveal(item.pos.sub(0, this.height*this.scale.y));
            }
         });
         this.on('bumpDone', ()=>{
            if (!revealingItem && !nextItem) return;
            revealingItem = nextItem;
            nextItem = undefined;
            if (!isPowerup(revealingItem)) {
               revealingItem = undefined;
               return;
            }
            this.unpackItem(revealingItem);
            revealingItem.reveal();
            revealingItem.on('revealDone', ()=>revealingItem = undefined);
            revealingItem.onDestroy(()=>revealingItem = undefined);
         });
         this.on('itemsEmpty', ()=>{
            if (this.curAnim()!==emptyAnim) this.play(emptyAnim);
         });
      },
  };
}
