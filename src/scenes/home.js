import k from '../kaplayCtx';
import { makeFadeIn, makeFadeOut } from '../ui/fader';

export default function() {
   let transitioning = false;
   makeFadeIn({ speed: 4 });
   k.add([
      k.text('Mario Playground', { size: 48, align: 'center', width: k.width() }),
      k.pos(k.width()/2, k.height()/2 - 100),
      k.color(k.WHITE),
      k.opacity(0.8),
      k.anchor('center'),
   ]);
   k.add([
      k.text('Press spacebar to start', { size: 26, align: 'center', width: k.width() }),
      k.pos(k.width()/2, k.height()/2 + 50),
      k.color(k.WHITE),
      k.opacity(0.6),
      k.anchor('center'),
   ]);
   k.onKeyPress(['space', 'enter', 'shift', 'z'], () => {
      if (transitioning) return;
      transitioning = true;
      k.play('level-enter');
      makeFadeOut({ speed: 1.1, onDone: ()=>k.go('game') });
   });
   k.go('game');
}
