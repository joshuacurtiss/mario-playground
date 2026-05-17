import k from "../kaplayCtx";
import { Anchor, GameObj, Rect, Vec2 } from 'kaplay';
import { isGameObjWithPos, isGameObjWithRect, isGameObjWithAnchor, isGameObjWithRotate } from "./type-guards";

/**
 * Returns a Vec2 to represent an anchor point as a vector. This is helpful when calculating positions
 * based on an anchor.
 */
export function anchorToUnitVec(anchor: Anchor | Vec2): Vec2 {
   if (typeof anchor !== 'string') return anchor;
   switch (anchor) {
      case 'topleft': return k.vec2(0, 0);
      case 'top': return k.vec2(0.5, 0);
      case 'topright': return k.vec2(1, 0);
      case 'left': return k.vec2(0, 0.5);
      case 'center': return k.vec2(0.5, 0.5);
      case 'right': return k.vec2(1, 0.5);
      case 'botleft': return k.vec2(0, 1);
      case 'bot': return k.vec2(0.5, 1);
      case 'botright': return k.vec2(1, 1);
   }
}

/**
 * Returns a Rect that is the intersection of two rects, or undefined if they don't intersect.
 */
export function intersectRects(a: Rect, b: Rect): Rect | undefined {
   const left = Math.max(a.pos.x, b.pos.x);
   const top = Math.max(a.pos.y, b.pos.y);
   const right = Math.min(a.pos.x + a.width, b.pos.x + b.width);
   const bottom = Math.min(a.pos.y + a.height, b.pos.y + b.height);
   if (right <= left || bottom <= top) return undefined;
   return new k.Rect(k.vec2(left, top), right - left, bottom - top);
}

/**
 * Calculate world bounds of a game object with a rectangular area, taking into account its position,
 * anchor, and rotation. Returns undefined if the object doesn't have the necessary properties.
 */
export function getRectWorldBounds(obj: GameObj): Rect | undefined {
   if (!isGameObjWithPos(obj) || !isGameObjWithRect(obj)) return undefined;
   const { width, height } = obj;
   // Get anchor offset
   let anchorOffset = k.vec2(0);
   if (isGameObjWithAnchor(obj)) {
      const anchor = anchorToUnitVec(obj.anchor);
      anchorOffset = k.vec2(anchor.x * width, anchor.y * height);
   }
   // Get rotation offset
   let rotOffset = k.vec2(0);
   if (isGameObjWithRotate(obj)) {
      if (obj.angle === 180) {
         rotOffset = k.vec2(0, height);
      } else if (Math.abs(obj.angle) === 90) {
         rotOffset = k.vec2(width/2*obj.angle/90, height/2);
      }
   }
   // Top-left position is obj.pos minus the anchor offset
   const topLeft = k.vec2(obj.pos).sub(anchorOffset).add(rotOffset);
   return new k.Rect(topLeft, width, height);
}
