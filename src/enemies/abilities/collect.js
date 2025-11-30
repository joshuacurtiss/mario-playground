import { makeIndicator } from "../../ui/indicator";

export function collect() {
   return {
      id: 'collect',
      require: [ 'area', 'points', 'pos' ],
      collect() {
         if (this.points) makeIndicator(this.pos.sub(0, this.area.shape.height*this.scale.y-this.area.shape.pos.y*this.scale.y), { msg: this.points });
      },
   }
}
