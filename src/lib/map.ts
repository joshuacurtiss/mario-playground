import { GameObj, Vec2 } from 'kaplay';
import k from '../kaplayCtx';
import { factories as itemFactories, ItemFactory } from '../items';
import { factories as enemyFactories } from '../enemies';
import enemySpriteData from '../../public/assets/sprites/enemies.json';
import itemSpriteData from '../../public/assets/sprites/items.json';

const ITEMS_LAYER_NAME = 'items';
const ENEMIES_LAYER_NAME = 'enemies';
const SPAWN_LAYER_NAME = 'spawn';

export const LAYER_TYPE = {
   TILELAYER: 'tilelayer',
   OBJECTGROUP: 'objectgroup',
   IMAGELAYER: 'imagelayer',
};

interface SpawnPoint {
   name: string;
   pos: Vec2;
   type: string;
}

interface TileData {
   sprite: string;
   scale: number;
   pos: Vec2;
   frame: number;
}

interface TilesetLookup {
   sprite: string;
   firstgid: number;
}

interface Tag {
   name: string;
   from: number;
   to: number;
}

interface AsepriteData {
   frames: { filename: string; }[];
   meta: { frameTags: Tag[]; };
}

interface ItemFactoryDescription {
   item: string | ItemFactory;
   type?: string;
   options?: Record<string, any>;
}

function isItemFactoryDescription(obj: any): obj is ItemFactoryDescription {
   return !!obj && typeof obj === 'object' && 'item' in obj && ['string', 'function'].includes(typeof obj.item);
}

const ITEM_FRAME_TAGS = (itemSpriteData as AsepriteData).meta.frameTags;
const ENEMY_FRAME_TAGS = (enemySpriteData as AsepriteData).meta.frameTags;

/**
 * Looks up the tag for a given frame number in the provided tags array.
 */
function getFrameTag(frame: number, tags: Tag[]): string | undefined {
   return tags.find((tag) => frame >= tag.from && frame <= tag.to)?.name;
}

/**
 * Receives a name like `coin` and converts it to the corresponding factory function, like `makeCoin`.
 * It searches for the name in `factories` of the `items` module, which we call `itemFactories` here.
 */
function convertToItemFactory(str: string): ItemFactory {
   const item = str.toLowerCase();
   if (item in itemFactories) return itemFactories[item as keyof typeof itemFactories];
   throw new Error(`Unknown item type: ${str}`);
}

/**
 * Converts a JSON string to an object/array, but if parsing fails, it just returns the original string.
 */
function convertJson(str: string): any {
   try {
      return JSON.parse(str);
   } catch (_) {
      return str;
   }
}

interface TiledListProperty {
   name: string;
   value: any;
}

/**
 * Receives a properties list from a Tiled object, which is an array of objects with "name" and "value"
 * properties, and converts it to a single object where the keys are the property names and the values are
 * the property values. It also does some additional processing:
 *  - If a property value is a JSON string, it converts it to an object/array.
 *  - If there are "item" and "items" properties, it merges them into a single "items" array.
 *  - If "item" or "items" was a Tiled array, it converts it to a simple array of values.
 *  - If any item in the "items" array is a comma-separated string, it randomly chooses one of the items.
 */
function convertPropertiesListToObj(properties?: TiledListProperty[]): Record<string, any> {
   const obj: Record<string, any> = {};
   if (!properties) return obj;
   // Convert the list of properties to an object
   for (const prop of properties) obj[prop.name] = prop.value;
   // Convert JSON strings to objects
   for (const key in obj) obj[key] = convertJson(obj[key]);
   // Merge "item" and "items" properties into one "items" array
   obj.items = [
      Array.isArray(obj.items) ? obj.items : [ obj.items ],
      Array.isArray(obj.item) ? obj.item : [ obj.item ]
   ].flat().filter((x) => x !== undefined && x !== null).map(item=>{
      // Convert formal lists to just a string array
      if (typeof item === 'object' && 'type' in item && 'value' in item) return item.value;
      return item;
   }).map(item=>{
      // If an "item" property is a comma-separated string, randomly choose one of the items
      if (typeof item === 'string' && item.indexOf(',') > -1) return k.choose(item.split(','));
      return item;
   }).map(convertJson);
   delete obj.item;
   return obj;
}

function spawnEnemyByTag(tag: string, pos: Vec2, properties?: TiledListProperty[]): void {
   // Typically the tag will be in the format "kind-type", where "kind" is the enemy, like "goomba", and "type" is the specific variety, like "brn" or "red".
   // But if you need to override the kind or type, you can provide it as a property in Tiled. There is no known use case for this, but it's there if you need
   // it and follows the same pattern as spawnItemByTag for consistency.
   const {kind: kindProp, type: typeProp, ...options} = convertPropertiesListToObj(properties);
   const parts = tag.split('-');
   const char = kindProp ?? parts[0];
   const type = typeProp ?? parts[1];
   if (char in enemyFactories) {
      const fac = enemyFactories[char as keyof typeof enemyFactories];
      fac(pos, { ...options, type });
   }
}

function spawnItemByTag(tag: string, pos: Vec2, properties?: TiledListProperty[]): void {
   // Typically the tag will be in the format "kind-type", where "kind" is the item, like "block", and "type" is the specific variety, like "question" or "brick".
   // But if you need to override the kind or type, you can provide it as a property in Tiled. A good example use case is if you have a coin, but you specifically
   // want it to be a "coinwithbody" which isn't a tagged sprite, then you would define "kind": "coinwithbody" in the Tiled properties for that item.
   const {items: itemsProp, kind: kindProp, type: typeProp, ...options} = convertPropertiesListToObj(properties);
   const kind = kindProp ?? tag.split('-')[0];
   const type = typeProp ?? tag.split('-')[1];

   const items = itemsProp?.map((obj: string): ItemFactoryDescription => {
      if (typeof obj === 'string') return { item: obj };
      if (isItemFactoryDescription(obj)) return obj;
      throw new Error(`Invalid item factory description: ${JSON.stringify(obj)}`);
   }).map((obj: ItemFactoryDescription) => {
      if (typeof obj.item === 'string') return { ...obj, item: convertToItemFactory(obj.item) };
      else throw new Error(`Item factory description must be a string: ${JSON.stringify(obj)}`);
   }).map((obj: ItemFactoryDescription) => {
      if (typeof obj.item !== 'function') throw new Error(`Item factory could not be resolved to a function: ${JSON.stringify(obj)}`);
      return obj.item(pos, obj.options);
   }) ?? [];

   if (kind in itemFactories) {
      const fac = itemFactories[kind as keyof typeof itemFactories] as ItemFactory;
      fac(pos, { ...options, type, items });
   }
}

export default function makeMap(mapData: any, position: Vec2, scale: number) {
   const tilesets: TilesetLookup[] = mapData.tilesets.map((tileset: any) => ({
      sprite: tileset.source.replace(/\.\w+$/, ''),
      firstgid: tileset.firstgid,
   }));
   return {
      tilesData: [] as TileData[],
      spawn: [] as SpawnPoint[],
      tileSize: mapData.tilewidth,
      mapOriginPos: position,
      mapData,
      scale,
      images: [] as GameObj[],
      generateTilesData() {
         const images: GameObj[] = [];
         let imageZ = -100;
         // Loop over LAYERS
         for (const layer of this.mapData.layers) {
            if (layer.type === LAYER_TYPE.TILELAYER) {
               const currentTilePos = k.vec2(this.mapOriginPos);
               // Loop over all TILES (gid) in layer
               for (const gid of layer.data) {
                  if (currentTilePos.x === this.mapOriginPos.x + layer.width * this.tileSize) {
                     currentTilePos.x = this.mapOriginPos.x;
                     currentTilePos.y += this.tileSize;
                  }
                  if (gid === 0) {
                     currentTilePos.x += this.tileSize;
                     continue;
                  }
                  let tileset: TilesetLookup | undefined;
                  for (let i = tilesets.length - 1; i >= 0; i--) {
                     if (tilesets[i].firstgid <= gid) {
                        tileset = tilesets[i];
                        break;
                     }
                  }
                  if (!tileset) {
                     currentTilePos.x += this.tileSize;
                     continue;
                  }

                  const frame = gid - tileset.firstgid;
                  const tilePos = k.vec2(currentTilePos.add(layer.offsetx ?? 0, layer.offsety ?? 0)).scale(this.scale);

                  const tileData = {
                     sprite: tileset.sprite,
                     scale: this.scale,
                     pos: tilePos,
                     frame,
                  };
                  this.tilesData.push(tileData);
                  currentTilePos.x += this.tileSize;
               }
            }
            if (layer.type === LAYER_TYPE.IMAGELAYER) {
               const name = layer.image.replace('../', '').replace(/\.\w+$/, '').replace('/', '-');
               const originX = (this.mapOriginPos.x + (layer.offsetx ?? 0)) * this.scale;
               const originY = (this.mapOriginPos.y + (layer.offsety ?? 0)) * this.scale;
               const imageWidth = (layer.imagewidth ?? 0) * this.scale;
               const imageHeight = (layer.imageheight ?? 0) * this.scale;
               const mapMaxX = (this.mapOriginPos.x + this.mapData.width * this.mapData.tilewidth) * this.scale;
               const mapMaxY = (this.mapOriginPos.y + this.mapData.height * this.mapData.tileheight) * this.scale;
               imageZ += 1;
               for (let x=originX ; x<mapMaxX ; x+=imageWidth) {
                  for (let y=originY ; y<mapMaxY; y+=imageHeight) {
                     const pos = k.vec2(x, y);
                     images.push(k.add([
                        k.sprite(name),
                        k.scale(this.scale),
                        k.opacity(layer.opacity ?? 1),
                        k.z(imageZ),
                        k.pos(pos),
                        {
                           parallax: k.vec2(1 - (layer.parallaxx ?? 1), 1 - (layer.parallaxy ?? 1)),
                           originPos: pos,
                        },
                     ]));
                     if (!layer.repeaty) break;
                  }
                  if (!layer.repeatx) break;
               }
            }
            if (layer.type === LAYER_TYPE.OBJECTGROUP) {
               if (layer.name === ITEMS_LAYER_NAME) {
                  // Get items first gid
                  const itemsFirstGid = tilesets.find((ts) => ts.sprite === 'items')?.firstgid ?? 0;
                  // Loop over ITEMS
                  for (const obj of layer.objects) {
                     const tag = getFrameTag(obj.gid - itemsFirstGid, ITEM_FRAME_TAGS);
                     if (tag) {
                        spawnItemByTag(tag, this.mapOriginPos.add(obj.x, obj.y-this.tileSize).scale(this.scale), obj.properties);
                     }
                  }
               } else if (layer.name === ENEMIES_LAYER_NAME) {
                  // Get enemies first gid
                  const enemiesFirstGid = tilesets.find((ts) => ts.sprite === 'enemies')?.firstgid ?? 0;
                  // Loop over ENEMIES
                  for (const obj of layer.objects) {
                     const tag = getFrameTag(obj.gid - enemiesFirstGid, ENEMY_FRAME_TAGS);
                     if (tag) {
                        spawnEnemyByTag(tag, this.mapOriginPos.add(obj.x+this.tileSize, obj.y).scale(this.scale), obj.properties);
                     }
                  }
               } else if (layer.name === SPAWN_LAYER_NAME) {
                  const spawn: SpawnPoint[] = [];
                  for (const obj of layer.objects) {
                     spawn.push({
                        name: obj.name,
                        type: obj.type,
                        pos: this.mapOriginPos.add(obj.x, obj.y).scale(this.scale),
                     });
                  }
                  this.spawn = spawn;
               } else {
                  for (const object of layer.objects) {
                     // Treat any remaining object layers as static collision layers
                     k.add([
                        k.area({ shape: new k.Rect(k.vec2(0), object.width, object.height) }),
                        k.scale(this.scale),
                        k.pos(this.mapOriginPos.add(object.x, object.y).scale(this.scale)),
                        k.body({ isStatic: true }),
                        'immovable',
                        object.type,
                     ]);
                  }
               }
            }
         }
         this.images = images;
      },
      render() {
         // Draw tiles at z -50 to ensure they are behind all items.
         const tileLayer = k.add([ k.z(-50) ]);
         tileLayer.onDraw(() => {
            this.tilesData.forEach(tile => k.drawSprite(tile));
         });
      },
   };
};
