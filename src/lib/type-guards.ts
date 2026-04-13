import { GameObj, AreaComp, BodyComp, OpacityComp, PosComp, Rect, Shape } from 'kaplay';

export function isRect(o: Shape): o is Rect {
   return 'width' in o && 'height' in o;
}

export function isGameObjWithArea(obj: GameObj): obj is GameObj<AreaComp> {
   return obj.has('area');
}

export function isGameObjWithBody(obj: GameObj): obj is GameObj<BodyComp> {
   return obj.has('body');
}

export function isGameObjWithOpacity(obj: GameObj): obj is GameObj<OpacityComp> {
   return obj.has('opacity');
}

export function isGameObjWithPos(obj: GameObj): obj is GameObj<PosComp> {
   return obj.has('pos');
}
