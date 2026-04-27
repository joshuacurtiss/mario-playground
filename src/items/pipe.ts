import k, { scale } from '../kaplayCtx';
import type { GameObj, Vec2 } from 'kaplay';

export const pipeOpenings = [ 'left', 'right', 'top', 'bot' ] as const;
export type PipeOpening = typeof pipeOpenings[number];

export function isPipeOpening(val: string): val is PipeOpening {
   return (pipeOpenings as readonly string[]).includes(val);
}

interface PipeData {
   pipeName: string;
   transport: string;
   opening: PipeOpening;
   width: number;
   height: number;
}

export type Pipe = GameObj<PipeData>;

export interface PipeOpt {
   name: string;
   width: number;
   height: number;
   transport: string;
   opening: PipeOpening;
}

const optionDefaults: PipeOpt = {
   name: '',
   width: 32,
   height: 48,
   transport: '',
   opening: 'top',
};

export function makePipe(pos: Vec2, options: Partial<PipeOpt> = {}): Pipe {
   const { name, width, height, transport, opening } = Object.assign({}, optionDefaults, options);
   return k.add([
      k.pos(pos),
      k.area({ shape: new k.Rect(k.vec2(0, 0), width, height) }),
      k.body({ isStatic: true }),
      k.scale(scale),
      'pipe',
      'immovable',
      {
         pipeName: name,
         transport,
         opening,
         width,
         height,
      },
   ]);
}

export function isPipe(obj?: GameObj): obj is Pipe {
   return !!obj && obj.is('pipe') && obj.has('body') && obj.has('area');
}
