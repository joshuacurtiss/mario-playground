import k from "./kaplayCtx";
import game from "./scenes/game";
import home from "./scenes/home";

// Sprite Items
[
   'items',
   'enemies',
   'hud-digits',
   'hud-items',
   'terrain-bush',
   'terrain-cave',
   'terrain-cloud',
   'terrain-cloudface',
   'terrain-floating-plank',
   'terrain-goal',
   'terrain-grass',
   'terrain-pipe-green',
   'terrain-plank',
   'terrain-platform-blue',
   'terrain-platform-green',
   'terrain-platform-orange',
   'terrain-platform-white',
   'terrain-sand',
   'text-lives',
].forEach(name => {
   k.loadAseprite(name, `assets/sprites/${name}.png`, `assets/sprites/${name}.json`);
});

// Sprite Characters
[ 'mario-normal', 'mario-tan', 'mario-fire', 'mario-raccoon' ].forEach(name => {
   k.loadAseprite(name, `assets/sprites/chars-${name}.png`, `assets/sprites/chars-${name}.json`);
});

// Large Sprites
[
   'bg-clouds',
   'bg-grassland',
   'ui-1up',
   'ui-hud-cards',
   'ui-hud-dashboard',
   'ui-hud-items',
   'ui-time-up',
].forEach(name => {
   k.loadSprite(name, `assets/${name.replace('-', '/')}.png`);
});

// SFX
[
   '1up', 'brick-break', 'bump-block', 'checkpoint', 'coin-special', 'coin', 'course-clear',
   'course-clear-fireworks', 'die', 'fireball', 'game-over', 'hit', 'hurt', 'hurry-up',
   'invincible', 'jump', 'key', 'kick', 'level-enter', 'p-meter', 'pause', 'powerup-appears',
   'powerup', 'score-end', 'score', 'spin', 'skid', 'stomp', 'transform',
].forEach(name => {
    k.loadSound(name, `assets/sfx/${name}.ogg`);
});

// Music
[
   'athletic',
   'ground',
   'underground',
].forEach(prefix => {
   k.loadSound(`${prefix}-intro`, `assets/music/${prefix}-intro.ogg`);
   k.loadSound(`${prefix}-loop`, `assets/music/${prefix}-loop.ogg`);
});

// Scenes
k.scene('home', home);
k.scene('game', game);

k.go('home');
