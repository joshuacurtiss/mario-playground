import { GameObj, AreaComp, BodyComp, OpacityComp, PosComp, Rect, RectComp, Shape, AnchorComp, RotateComp } from 'kaplay';

export function isRect(o: Shape): o is Rect {
   return 'width' in o && 'height' in o;
}

export function isGameObjWithArea(obj: GameObj): obj is GameObj<AreaComp> {
   return obj.has('area');
}

export function isGameObjWithAnchor(obj: GameObj): obj is GameObj<AnchorComp> {
   return obj.has('anchor');
}

export function isGameObjWithBody(obj: GameObj): obj is GameObj<BodyComp> {
   return obj.has('body');
}

export function isGameObjWithRect(obj: GameObj): obj is GameObj<RectComp> {
   return obj.has('rect');
}

export function isGameObjWithRotate(obj: GameObj): obj is GameObj<RotateComp> {
   return obj.has('rotate');
}

export function isGameObjWithOpacity(obj: GameObj): obj is GameObj<OpacityComp> {
   return obj.has('opacity');
}

export function isGameObjWithPos(obj: GameObj): obj is GameObj<PosComp> {
   return obj.has('pos');
}
