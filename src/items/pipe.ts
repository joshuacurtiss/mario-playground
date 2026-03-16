import k, { scale } from '../kaplayCtx';
import type { GameObj, Vec2 } from 'kaplay';

// TODO: Eventually, will have SpawnComp, which spawns an item or enemy.
export type Pipe = GameObj;
export type PipeType = 'green';

export interface PipeOpt {
   type: PipeType;
   height: number;
}

const optionDefaults: PipeOpt = {
   type: 'green',
   height: 3,
};

export function makePipe(pos: Vec2, options: Partial<PipeOpt> = {}): Pipe {
   let { type, height } = Object.assign({}, optionDefaults, options);
   const obj = k.add([
      k.pos(pos),
      k.area({ shape: new k.Rect(k.vec2(0, 0), 32, 16*height) }),
      k.body({ isStatic: true }),
      k.scale(scale),
      k.anchor('bot'),
      'pipe',
      `pipe-${type}`,
      'immovable',
   ]);
   for (let i=0; i<height-1; i++) {
      obj.add([
         k.sprite(`terrain-pipe-${type}`, { frame: 2 }),
         k.anchor('botright'),
         k.pos(0, -i*16),
      ]);
      obj.add([
         k.sprite(`terrain-pipe-${type}`, { frame: 3 }),
         k.anchor('botleft'),
         k.pos(0, -i*16),
      ]);
   }
   obj.add([
      k.sprite(`terrain-pipe-${type}`, { frame: 0 }),
      k.anchor('botright'),
      k.pos(0, -(height-1)*16),
   ]);
   obj.add([
      k.sprite(`terrain-pipe-${type}`, { frame: 1 }),
      k.anchor('botleft'),
      k.pos(0, -(height-1)*16),
   ]);
   return obj;
}
