import kaplay from "kaplay";

const params = new URLSearchParams(window.location.search);
export const debug = params.has('debug');

const k = kaplay({
   width: 1280,
   height: 720,
   letterbox: true,
   background: [0, 0, 0],
   global: false,
   buttons: {
      left: {
         keyboard: ['a', 'left'],
      },
      right: {
         keyboard: ['d', 'right'],
      },
      up: {
         keyboard: ['w', 'up'],
      },
      down: {
         keyboard: ['s', 'down'],
      },
      turbo: {
         keyboard: ['shift'],
      },
      jump: {
         keyboard: ['space', 'z', 'control'],
      },
   },
   touchToMouse: false,
   debugKey: '`',
   debug,
});

export default k;
