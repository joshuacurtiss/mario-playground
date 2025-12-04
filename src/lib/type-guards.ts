import { Rect, Shape } from 'kaplay';

export function isRect(o: Shape): o is Rect {
   return 'width' in o && 'height' in o;
}
