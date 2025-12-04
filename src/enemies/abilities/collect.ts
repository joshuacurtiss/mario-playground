import { Comp } from 'kaplay';
import { Enemy } from '../index'
import { isRect } from '../../lib/type-guards';
import { makeIndicator } from "../../ui/indicator";

export interface CollectComp extends Comp {
   collect(): void;
}

export function collect() {
   return {
      id: 'collect',
      require: [ 'area', 'points', 'pos' ],
      collect(this: Enemy) {
         if (!this.points) return;
         if (!this.area.shape) return;
         if (!isRect(this.area.shape)) return;
         const { height, pos } = this.area.shape;
         makeIndicator(this.pos.sub(0, height*this.scale.y-pos.y*this.scale.y), { msg: this.points.toFixed(0) });
      },
   }
}
