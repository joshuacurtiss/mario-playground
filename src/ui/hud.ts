import k, { scale } from '../kaplayCtx';
import type { GameObj, PosComp, SpriteComp } from 'kaplay';

type DigitObj = GameObj<PosComp | SpriteComp>;
type SingleDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type PlayerName = 'mario' | 'luigi';

export function makeHUD() {
   let _world: SingleDigit;
   let _player: PlayerName;
   let _lives: number;
   let _score: number;
   let _time: number;
   let _coins: number;
   let _p_count = 0;
   let _p_dash = false;
   const container = k.make([
      k.anchor('botleft'),
      k.pos(0, k.height()-3*scale),
      k.scale(scale),
      'hud',
      {
         get world() { return _world; },
         get player() { return _player; },
         get lives() { return _lives; },
         get score() { return _score; },
         get time() { return _time; },
         get coins() { return _coins; },
         get pCount() { return _p_count; },
         get pDash() { return _p_dash; },
         set world(val) {
            if (_world===val) return;
            _world = val;
            worldDigit.frame = val;
         },
         set player(val) {
            if (_player===val) return;
            _player = val;
            playerIndicator.frame = val === 'mario' ? 2 : 3;
         },
         set lives(val) {
            if (_lives===val) return;
            _lives = val;
            setDigits(livesDigits, val);
         },
         set score(val) {
            if (_score===val) return;
            _score = val;
            setDigits(scoreDigits, val, '0');
         },
         set time(val) {
            const newVal = Math.floor(val<0 ? 0 : val);
            if (_time===newVal) return;
            _time = newVal;
            setDigits(timeDigits, newVal, '0');
         },
         set coins(val) {
            if (_coins===val) return;
            _coins = val;
            setDigits(coinDigits, val);
         },
         set pCount(val) {
            if (val===_p_count) return;
            _p_count = val;
            const fullArrows = Math.floor(val);
            for (let i=0 ; i<pCountArrows.length ; i++) {
               const frame = i < fullArrows ? 12 : 11;
               if (pCountArrows[i].frame !== frame) pCountArrows[i].frame = frame;
            }
         },
         set pDash(val) {
            _p_dash = val;
            if (!_p_dash) pDashIndicator.frame = 0;
         },
         fixedUpdate() {
            if (_p_dash) {
               const newFrame = Math.floor(k.time() * 10) % 2;
               if (pDashIndicator.frame !== newFrame) pDashIndicator.frame = newFrame;
            }
         },
      }
   ]);
   const dashboard = container.add([
      k.sprite('ui-hud-dashboard'),
      k.anchor('botleft'),
      k.opacity(1),
   ]);
   const makeDigitObj = (x: number, y: number): DigitObj => {
      return dashboard.add([k.sprite('hud-digits', {frame: 10}), k.pos(x, y)]);
   };
   const makeDigitObjArray = (x: number, y: number, count: number): DigitObj[] => {
      return Array(count).fill(0).map((_, i)=>makeDigitObj(x + i*8, y));
   };
   const setDigits = (arr: DigitObj[], val: number, pad: string = ' ') => {
      // Ensure pad is valid: Space or digit
      if (' 0123456789'.indexOf(pad) < 0) pad = ' ';
      let str = val.toString().padStart(arr.length, pad);
      if (str.length>arr.length) str = str.slice(-arr.length);
      for (let i=0 ; i<arr.length ; i++) {
         const char = str.charAt(i);
         const frame = char === ' ' ? 10 : parseInt(char);
         if (arr[i].frame !== frame) arr[i].frame = frame;
      }
   };
   const worldDigit = makeDigitObj(35, -21);
   const livesDigits = makeDigitObjArray(27, -13, 2);
   const scoreDigits = makeDigitObjArray(51, -13, 7);
   const timeDigits = makeDigitObjArray(123, -13, 3);
   const coinDigits = makeDigitObjArray(131, -21, 2);
   const pCountArrows = Array(6).fill(0).map((_, i) => {
      return dashboard.add([
         k.sprite('hud-digits', { frame: 11 }),
         k.pos(51 + i*8, -21),
      ]);
   });
   const pDashIndicator = dashboard.add([
      k.sprite('hud-items', { frame: 0 }),
      k.pos(99, -29),
   ]);
   const playerIndicator = dashboard.add([
      k.sprite('hud-items', { frame: 2 }),
      k.pos(3, -21),
   ]);
   const cards = Array(3).fill(0).map((_, i) => {
      const card = container.add([
         k.sprite('ui-hud-cards'),
         k.pos(156 + i*26, 0),
         k.anchor('botleft'),
      ]);
      card.add([
         k.sprite('hud-items', { anim: 'blank', animSpeed: 0 }),
         k.anchor('botleft'),
         k.pos(3, -5),
      ]);
      return card;
   });
   const items = container.add([
      k.sprite('ui-hud-items'),
      k.anchor('botleft'),
      k.opacity(0),
   ]);

   return container;
};
