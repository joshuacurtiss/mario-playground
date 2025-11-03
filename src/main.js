import k from "./kaplayCtx";
import game from "./scenes/game";

// Sprites
k.loadAseprite('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
k.loadAseprite('mario', 'assets/sprites/mario.png', 'assets/sprites/mario.json');

// Scenes
k.scene('game', game);

k.go('game');
