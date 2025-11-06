import k from "./kaplayCtx";
import game from "./scenes/game";
import home from "./scenes/home";

// Sprite Items
[ 'items', 'enemies' ].forEach(name => {
   k.loadAseprite(name, `assets/sprites/${name}.png`, `assets/sprites/${name}.json`);
});

// Sprite Characters
[ 'mario-normal', 'mario-tan', 'mario-fire', 'mario-raccoon' ].forEach(name => {
   k.loadAseprite(name, `assets/sprites/chars-${name}.png`, `assets/sprites/chars-${name}.json`);
});

// Backgrounds
[ 'bg-clouds', 'bg-grassland' ].forEach(name => {
   k.loadSprite(name, `assets/${name.replace('bg-', 'bg/')}.png`);
});

// Audio
[
   '1up', 'brick-break', 'bump-block', 'coin-special', 'coin', 'die', 'fireball', 'hit',
   'hurt', 'jump', 'key', 'kick', 'level-enter', 'p-meter', 'pause', 'powerup-appears',
   'powerup', 'spin', 'skid', 'stomp', 'transform',
].forEach(name => {
    k.loadSound(name, `assets/sfx/${name}.ogg`);
});

// Scenes
k.scene('home', home);
k.scene('game', game);

k.go('home');
