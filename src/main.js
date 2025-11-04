import k from "./kaplayCtx";
import game from "./scenes/game";

// Sprites
k.loadAseprite('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
k.loadAseprite('mario-normal', 'assets/sprites/chars-mario-normal.png', 'assets/sprites/chars-mario-normal.json');
k.loadAseprite('mario-tan', 'assets/sprites/chars-mario-tan.png', 'assets/sprites/chars-mario-tan.json');

// Audio
[
   '1up', 'brick-break', 'bump-block', 'coin-special', 'coin', 'die', 'fireball', 'hit',
   'hurt', 'jump', 'key', 'kick', 'level-enter', 'p-meter', 'pause', 'powerup-appears',
   'powerup', 'spin', 'skid', 'stomp', 'transform',
].forEach(name => {
    k.loadSound(name, `assets/sfx/${name}.ogg`);
});

// Scenes
k.scene('game', game);

k.go('game');
