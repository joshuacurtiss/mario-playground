import { Char } from '../chars';
import k, { scale } from '../kaplayCtx';
import type { AnchorComp, AreaComp, Comp, GameObj, OffScreenComp, OpacityComp, PosComp, ScaleComp, SpriteComp, TimerComp, TimerController, Vec2, ZComp } from 'kaplay';

export const GOAL_ITEMS = ['mushroom', 'flower', 'star'] as const;
export type GoalItem = typeof GOAL_ITEMS[number];

export const fireworks = {
   "mushroom": [
      '     ******     ',
      '   ****  ****   ',
      '  *****  *****  ',
      ' ** **    ** ** ',
      ' *            * ',
      '**    ****    **',
      '***  ******  ***',
      '***  ******  ***',
      '***  ******  ***',
      '**    ****    **',
      '*  **********  *',
      '****  *  *  ****',
      ' **   *  *   ** ',
      '  *          *  ',
      '  **        **  ',
      '   **********   ',
   ],
   "star": [
      '       **       ',
      '      *  *      ',
      '      *  *      ',
      '     *    *     ',
      '******    ******',
      '*              *',
      ' *    *  *    * ',
      '  *   *  *   *  ',
      '   *  *  *  *   ',
      '   *        *   ',
      '  *          *  ',
      '  *          *  ',
      ' *     **     * ',
      ' *   **  **   * ',
      '*  **      **  *',
      '***          ***',
   ],
   "flower": [
      '   **********   ',
      ' ***        *** ',
      '**   ******   **',
      '*  ***    ***  *',
      '*  *  ****  *  *',
      '*  * *    * *  *',
      '**   ******   **',
      ' ***        *** ',
      '   **********   ',
      ' **   *  *   ** ',
      '*  ** *  * **  *',
      '* *  **  **  * *',
      '*  *  *  *  *  *',
      ' *  * *  * *  * ',
      '  ** **  ** **  ',
      '    ********    ',
   ],
} as Record<GoalItem, string[]>;

export type Goal = GameObj<SpriteComp & PosComp & AreaComp & ScaleComp & OpacityComp & OffScreenComp & AnchorComp & ZComp & TimerComp & GoalComp>;

export function isGoalItem(value: unknown): value is GoalItem {
   return typeof value === 'string' && GOAL_ITEMS.includes(value as any);
}

export interface GoalOpt {
   interval: number; // seconds between sprite alternations
}

export interface FireworksOpt {
   pixelSize: number;
   radius: number;
   pulseSpeed: number;
   pulseAmount: number;
   maskExpandDuration: number;
   maskOpacity: number;
   duration: number;
   z: number;
}

const optionDefaults: GoalOpt = {
   interval: 0.15,
};

const fireworksOptionDefaults: FireworksOpt = {
   pixelSize: 7 * scale,
   radius: 2.5 * scale,
   pulseSpeed: 1.75,
   pulseAmount: 0.5,
   maskExpandDuration: 0.5,
   maskOpacity: 0.25,
   duration: 10,
   z: 1003,
};

const fireworksPalette = [
   k.rgb(255, 45, 32),
   k.rgb(255, 130, 0),
   k.rgb(255, 220, 70),
   k.rgb(255, 255, 255),
];

function getPaletteColor(phase: number) {
   const p = ((phase % 1) + 1) % 1;
   const scaled = p * fireworksPalette.length;
   const index = Math.floor(scaled) % fireworksPalette.length;
   const nextIndex = (index + 1) % fireworksPalette.length;
   const mix = scaled - Math.floor(scaled);
   const from = fireworksPalette[index];
   const to = fireworksPalette[nextIndex];
   return k.rgb(
      k.lerp(from.r, to.r, mix),
      k.lerp(from.g, to.g, mix),
      k.lerp(from.b, to.b, mix),
   );
}

export interface GoalComp extends Comp {
   isCollected(): boolean;
   collect(player?: GameObj): void;
}

export type GoalCompOpt = Pick<GoalOpt, 'interval'>;

function goal(options: Partial<GoalCompOpt> = {}): GoalComp {
   const opts = Object.assign({}, optionDefaults, options);
   let index = 0;
   let timer: TimerController;
   return {
      id: 'goal',
      require: ['sprite'],
      add(this: Goal) {
         // Items are always anchored top left, but goal is anchored center for easier spin calculation.
         // So we adjust it after the fact since map generation is automatic and assumes top-left anchoring.
         k.wait(0, ()=>this.moveBy(this.width/2*scale, this.height/2*scale));
         this.onCollide('player', (player) => this.collect(player));
         timer = this.loop(opts.interval, ()=>{
            index = (index + 1) % GOAL_ITEMS.length;
            this.play(GOAL_ITEMS[index]);
         });
      },
      isCollected(this: Goal) {
         return !this.has('area');
      },
      collect(this: Goal, player: Char) {
         if (player.isFrozen) return;
         if (this.isCollected()) return;
         this.unuse('area');
         this.z = 1002;
         timer.cancel();
         k.play('checkpoint');
         const baseScaleX = Math.abs(this.scale.x) || scale;
         let spinTimer = 0;
         this.use(k.lifespan(2));
         this.onFixedUpdate(()=>{
            spinTimer += k.dt() * 14;
            const spinScale = 0.1 + 0.9 * (Math.sin(spinTimer) * 0.5 + 0.5);
            this.scale.x = baseScaleX * spinScale;
            this.moveBy(0, -150 * scale * k.dt());
         });
         player.trigger('goal', this);
      },
   };
}

export function makeFireworks(pos: Vec2, item: GoalItem, options: Partial<FireworksOpt> = {}) {
   const opts = Object.assign({}, fireworksOptionDefaults, options);
   const pattern = fireworks[item];
   const rowCount = pattern.length;
   const colCount = pattern[0]?.length ?? 0;
   const center = k.vec2(pos.x, pos.y);
   const origin = k.vec2(
      pos.x - (colCount * opts.pixelSize) / 2 + opts.pixelSize / 2,
      pos.y - (rowCount * opts.pixelSize) / 2 + opts.pixelSize / 2,
   );
   const maxRevealRadius = Math.hypot(
      ((colCount - 1) * opts.pixelSize) / 2,
      ((rowCount - 1) * opts.pixelSize) / 2,
   ) + opts.pixelSize;
   let maskAge = 0;
   const mask = k.add([
      k.pos(center),
      k.circle(1),
      k.color(255, 255, 255),
      k.opacity(opts.maskOpacity),
      k.scale(0.001),
      k.z(opts.z + 1),
      'firework-mask',
   ]);
   mask.onFixedUpdate(() => {
      maskAge += k.dt();
      const revealProgress = Math.min(1, maskAge / opts.maskExpandDuration);
      const revealRadius = Math.max(0.001, maxRevealRadius * revealProgress);
      mask.scale = k.vec2(revealRadius, revealRadius);
      mask.opacity = opts.maskOpacity * (1 - revealProgress);
      if (revealProgress >= 1) mask.destroy();
   });

   const dots = [];
   for (let y = 0; y < rowCount; y++) {
      const row = pattern[y];
      for (let x = 0; x < colCount; x++) {
         if (row[x] !== '*') continue;
         const dot = k.add([
            k.pos(origin.x + x * opts.pixelSize, origin.y + y * opts.pixelSize),
            k.circle(opts.radius),
            k.color(fireworksPalette[0]),
            k.opacity(0),
            k.scale(1),
            k.z(opts.z),
            'firework-dot',
         ]);
         const revealDistance = Math.hypot(dot.pos.x - center.x, dot.pos.y - center.y);
         let isRevealed = false;
         let t = 0;
         let age = 0;
         dot.onFixedUpdate(() => {
            const dt = k.dt();
            age += dt;
            t += dt * opts.pulseSpeed;
            const revealProgress = Math.min(1, maskAge / opts.maskExpandDuration);
            const revealRadius = maxRevealRadius * revealProgress;
            if (!isRevealed && revealDistance <= revealRadius) {
               isRevealed = true;
               dot.opacity = 1;
            }
            if (!isRevealed) return;
            const pulse = Math.sin(t * Math.PI * 2);
            const size = 1 + opts.pulseAmount * pulse;
            dot.color = getPaletteColor(t);
            dot.scale = k.vec2(Math.max(0.2, size), Math.max(0.2, size));
            if (age >= opts.duration) dot.destroy();
         });
         dots.push(dot);
      }
   }

   return dots;
}

export function makeGoal(pos: Vec2, options: Partial<GoalOpt> = {}): Goal {
   const opts = Object.assign({}, optionDefaults, options);
   return k.add([
      k.sprite('items', { anim: GOAL_ITEMS[0] }),
      k.pos(pos),
      k.area(),
      k.timer(),
      k.scale(scale),
      k.anchor('center'),
      k.offscreen({ pause: true, unpause: true }),
      k.opacity(),
      k.z(1),
      goal(opts),
      'goal',
   ]);
}
