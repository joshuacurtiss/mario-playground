import k from "./kaplayCtx";
import game from "./scenes/game";

// Sprites
k.loadAseprite('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
k.loadAseprite('mario-normal', 'assets/sprites/chars-mario-normal.png', 'assets/sprites/chars-mario-normal.json');
k.loadAseprite('mario-tan', 'assets/sprites/chars-mario-tan.png', 'assets/sprites/chars-mario-tan.json');

// Scenes
k.scene('game', game);

k.go('game');
