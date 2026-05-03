import k, { scale } from "../kaplayCtx";
import { GameObj, Vec2 } from 'kaplay';
import { Enemy, EnemyComp, EnemyComps, isEnemy } from './index';
import { collect } from "./abilities/collect";
import { points } from '../shared-abilities/points';
import { freeze } from '../shared-abilities/freeze';
import { isChar } from '../chars';
import { isRect } from "../lib/type-guards";

export type Piranha = GameObj<EnemyComps & PiranhaComp>;
export const PIRANHA_ENEMY_TAG = 'pir';
export const PIRANHA_FIRE_ENEMY_TAG = 'pirf';
export const PIRANHA_KINDS = [PIRANHA_ENEMY_TAG, PIRANHA_FIRE_ENEMY_TAG] as const;
export type PiranhaKind = typeof PIRANHA_KINDS[number];
export const PIRANHA_TYPES = ['nrm', 'grn', 'red'] as const;
export type PiranhaType = typeof PIRANHA_TYPES[number];
export const PIRANHA_ACTIONS = ['lkup', 'lkdn', 'spup', 'spdn', ''] as const;
export type PiranhaAction = typeof PIRANHA_ACTIONS[number];

export function isPiranhaType(val: string): val is PiranhaType {
   return PIRANHA_TYPES.includes(val as any);
}
export function isPiranhaKind(val: string): val is PiranhaKind {
   return PIRANHA_KINDS.includes(val as any);
}
export function isPiranhaAction(val: string): val is PiranhaAction {
   return PIRANHA_ACTIONS.includes(val as any);
}
export function isPiranha(obj: GameObj): obj is Piranha {
   return isEnemy(obj) && PIRANHA_KINDS.some(kind => obj.has(kind));
}
export interface PiranhaComp extends EnemyComp {
   get kind(): PiranhaKind;
   set kind(val: PiranhaKind);
   get type(): PiranhaType;
   set type(val: PiranhaType);
   get action(): PiranhaAction;
   set action(val: PiranhaAction);
   getSprite(): string;
   setSprite(newSprite: string): void;
   setAnim(anim: string): void;
   getKind(): PiranhaKind;
   getType(): PiranhaType;
   getAction(): PiranhaAction;
   calcWorldPos(heightPct?: number): Vec2 | undefined;
}

function calcPiranhaAnim(kind: PiranhaKind, type: PiranhaType, action: PiranhaAction): string {
   return `${kind}-${type}${action ? `-${action}` : ''}`;
}

export interface PiranhaCompOpt {
   speed: number;
   shy: boolean;
   hideTime: number;
   showTime: number;
   rotation: number;
}

const compOptionDefaults: PiranhaCompOpt = {
   speed: 25,
   shy: true,
   hideTime: 2,
   showTime: 1,
   rotation: 0,
};

function piranha(opts: Partial<PiranhaCompOpt> = {}): PiranhaComp {
   let dir = 1;
   let timer = 0;
   let shot = false;
   const { rotation, speed, hideTime, showTime, shy } = Object.assign({}, compOptionDefaults, opts);
   return {
      id: 'piranha',
      get kind(): PiranhaKind {
         return this.getKind();
      },
      set kind(val: PiranhaKind) {
         const k = isPiranhaKind(val) ? val : PIRANHA_KINDS[0];
         this.setAnim(calcPiranhaAnim(k, this.type, this.action));
      },
      getKind(this: Piranha): PiranhaKind {
         const k = this.getCurAnim()?.name.split('-')[0] ?? PIRANHA_KINDS[0];
         if (isPiranhaKind(k)) return k;
         throw new Error(`Invalid piranha kind: ${k}`);
      },
      get type(): PiranhaType {
         return this.getType();
      },
      set type(val: PiranhaType) {
         const t = isPiranhaType(val) ? val : PIRANHA_TYPES[0];
         this.setAnim(calcPiranhaAnim(this.kind, t, this.action));
      },
      getType(this: Piranha): PiranhaType {
         const t = this.getCurAnim()?.name.split('-')[1] ?? PIRANHA_TYPES[0];
         if (isPiranhaType(t)) return t;
         throw new Error(`Invalid piranha type: ${t}`);
      },
      get action(): PiranhaAction {
         return this.getAction();
      },
      set action(val: PiranhaAction) {
         const a = isPiranhaAction(val) ? val : '';
         this.setAnim(calcPiranhaAnim(this.kind, this.type, a));
      },
      getAction(this: Piranha): PiranhaAction {
         const action = this.getCurAnim()?.name.split('-')[2] ?? '';
         if (isPiranhaAction(action)) return action;
         throw new Error(`Invalid piranha action: ${action}`);
      },
      getSprite(this: Enemy): string {
         return this.sprite;
      },
      setSprite(this: Piranha, newSprite: string) {
         if (this.sprite === newSprite) return;
         const { flipX, frame } = this;
         this.use(k.sprite(newSprite, { frame, flipX }));
      },
      setAnim(this: Piranha, anim: string) {
         if (this.getCurAnim()?.name === anim) return;
         this.play(anim);
      },
      die(this: Piranha, player: GameObj) {
         if (player) player.trigger('collect', this);
         this.isFrozen = true;
         // Create a poof at the piranha's position
         const pos = this.calcWorldPos(0.5);
         this.area.shape = new k.Rect(k.vec2(0, 0), 0, 0);
         if (pos) {
            k.add([
               k.sprite('items', { anim: 'poof' }),
               k.anchor('center'),
               k.pos(pos),
               k.opacity(1),
               k.scale(scale),
               k.lifespan(0.4),
            ]);
         }
         k.play('hit');
         this.trigger('die');
         this.destroy();
      },
      stomp(this: Piranha, player: GameObj) {
         k.debug.log('You can\'t stomp a piranha!');
      },
      calcWorldPos(this: Piranha, heightPct=0.85): Vec2 | undefined {
         return this.worldPos()?.add(
            Math.abs(rotation) === 90 ? this.height*heightPct*scale*rotation/90 : 0,
            Math.abs(rotation) === 90 ? 0 : this.height*heightPct*scale*(rotation===0 ? -1 : heightPct)
         );
      },
      fixedUpdate(this: Piranha) {
         if (this.isFrozen) return;
         // Get player position, but only in situations where it is needed.
         let playerPos = k.vec2(0);
         if (shy || this.kind === PIRANHA_FIRE_ENEMY_TAG) {
            const player = k.get('player')[0];
            if (isChar(player)) playerPos = player.pos.sub(0, player.height/2*scale);
         }
         // Get piranha position, relative to pipe orientation.
         const pirPos = this.calcWorldPos();
         // If fireball piranha, adjust head to follow player
         if (this.kind === PIRANHA_FIRE_ENEMY_TAG && pirPos) {
            if (this.action.startsWith('sp')) {
               // During spit animation, head is fixed.
            } else if (Math.abs(rotation) === 90) {
               if (playerPos.y > pirPos.y) this.flipX = rotation > 0;
               else this.flipX = rotation <= 0;
               if( playerPos.x > pirPos.x) this.action = rotation > 0 ? 'lkup' : 'lkdn';
               else this.action = rotation > 0 ? 'lkdn' : 'lkup';
            } else {
               if (playerPos.x < pirPos.x) this.flipX = rotation > 0;
               else this.flipX = rotation <= 0;
               if( playerPos.y > pirPos.y) this.action = rotation > 0 ? 'lkup' : 'lkdn';
               else this.action = rotation > 0 ? 'lkdn' : 'lkup';
            }
         }
         // Up and down movement
         if (dir > 0 && this.pos.y >= this.height * scale) {
            if (timer <= hideTime) { timer += k.dt(); return; }
            if (shy && pirPos && Math.abs(playerPos.y-pirPos.y) < this.height*2*scale && Math.abs(playerPos.x-pirPos.x) < this.width*0.9*scale) return;
            dir = -1;
         } else if (dir < 0 && this.pos.y <= 0) {
            if (timer <= showTime) { timer += k.dt(); return; }
            if (this.kind === PIRANHA_FIRE_ENEMY_TAG && pirPos && !shot) {
               // Spit animation
               shot = true;
               this.action = this.action === 'lkdn' ? 'spdn' : 'spup';
               // Shoot fireball when emerging if fireball piranha
               const fireball = k.add([
                  k.sprite('enemies', { anim: 'fireball', flipX: !this.flipX }),
                  k.scale(scale),
                  k.area({
                     collisionIgnore: [ 'enemy', 'immovable', 'coin', 'powerup' ],
                     shape: new k.Rect(k.vec2(0,0),6,6),
                  }),
                  k.z(1),
                  k.pos(pirPos),
                  k.anchor('center'),
                  k.body({ isStatic: true }),
                  k.offscreen({ destroy: true, distance: 100*scale }),
                  'fireball',
               ]);
               // Set velocity of fireball to point at playerPos
               fireball.vel = playerPos.sub(fireball.pos).unit().scale(125);
               // Handle fireball colliding with player
               fireball.onCollide('player', (player) => {
                  if (!isChar(player) || player.isFrozen) return;
                  player.hurt();
                  k.add([
                     k.sprite('items', { anim: 'poof', animSpeed: 2 }),
                     k.scale(fireball.scale),
                     k.pos(fireball.pos),
                     k.anchor('center'),
                     k.opacity(1),
                     k.z(5),
                     k.lifespan(0.2),
                  ]);
                  fireball.destroy();
               });
            }
            // Restore normal head after spit animation for 0.5 second
            if (timer > showTime+0.5 && this.action.startsWith('sp')) this.action = this.action === 'spdn' ? 'lkdn' : 'lkup';
            if (timer <= showTime+1) { timer += k.dt(); return; }
            dir = 1;
         } else {
            this.move(0, dir * speed * scale);
            timer = 0;
            shot = false;
         }
      },
   };
}

export interface PiranhaOpt {
   kind: PiranhaKind;
   type: PiranhaType;
   points: number;
   rotation: number;
}

const optionDefaults: PiranhaOpt = {
   kind: PIRANHA_KINDS[0],
   type: PIRANHA_TYPES[0],
   points: 100,
   rotation: 0,
};

export function makePiranha(pos: Vec2, options: Partial<PiranhaOpt> = {}): Piranha {
   const opts = Object.assign({}, optionDefaults, options);
   const { kind, type, rotation } = opts;
   // Create mask so that piranha "disappears" behind the pipe even if the pipe is transparent collider.
   // The container also handles rotation of the piranha, so that logic of moving in and out is all
   // relative to the rotation of the container.
   const clip = k.add([
      k.pos(pos.add(-16 * scale * Math.abs(rotation)/90, 16 * scale * (Math.abs(rotation)===90 ? rotation/90 : 0))),
      k.anchor('bot'),
      k.rect(32 * scale, 32 * scale),
      k.opacity(1),
      k.z(3),
      k.rotate(rotation),
      k.mask('intersect'),
   ]);
   let anim = `${kind}-${type}`;
   if (kind===PIRANHA_FIRE_ENEMY_TAG) anim += '-lkdn';
   return clip.add([
      k.sprite('enemies', { anim, animSpeed: 0.5 }),
      k.scale(scale),
      k.area({
         shape: new k.Rect(k.vec2(0, -1), 16, 29),
         collisionIgnore: [ 'coin', 'enemy' ],
      }),
      k.anchor('bot'),
      k.body({ isStatic: true }),
      k.pos(0, 0),
      k.z(1),
      k.offscreen({ distance: 40*scale, pause: true, unpause: true }),
      collect(),
      points(opts.points),
      freeze(),
      piranha({ rotation }),
      'enemy',
      kind,
   ]);
};

export function makePiranhaWithFireball(pos: Vec2, options: Partial<PiranhaOpt> = {}): Piranha {
   return makePiranha(pos, { kind: PIRANHA_FIRE_ENEMY_TAG, ...options});
}
