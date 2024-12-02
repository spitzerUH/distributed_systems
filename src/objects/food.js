import Hexagon from 'phaser3-rex-plugins/plugins/hexagon.js';

class Food {
  constructor(data) {
    this._id = data.id;
    this._details = data.details;
    this._object = undefined;
    this._eaten = false;
  }
  get id() {
    return this._id;
  }
  get object() {
    return this._object;
  }
  get eaten() {
    return this._eaten;
  }
  createObject(scene) {
    return new Promise((resolve, reject) => {
      try {
        let hexagon = new Hexagon(0, 0, this._details.size, this._details.color);
        let graphics = scene.add.graphics()
          .fillStyle(this._details.color)
          .fillPoints(hexagon.points)
          .setInteractive(hexagon, Phaser.Geom.Polygon.Contains)
          .setPosition(this._details.x, this._details.y);
        scene.add.existing(graphics);
        scene.physics.add.existing(graphics);
        graphics.body.setCircle(this._details.size, -this._details.size, -this._details.size);
        graphics.body.setImmovable(true);
        this._object = graphics;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  destroyObject() {
    return new Promise((resolve, reject) => {
      try {
        if (this._object) {
          this._object.destroy();
        }
        this._object = undefined;
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  eat() {
    return new Promise((resolve, reject) => {
      try {
        this.destroyObject().then(() => {
          this._eaten = true;
          resolve(this._id);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  format() {
    return {
      id: this._id,
      details: this._details
    };
  }
}

function createFood(scene, data) {
  let food = [];
  data.forEach((foodData) => {
    let f = new Food(foodData);
    f.createObject(scene).then(() => {
      food.push(f);
    });
    food.push(f);
  });
  return food;
}

function createFoodCollision(scene, player) {
  if (player && player.object && player.object.body) {
    for (let foodid in scene.gameState.food) {
      let food = scene.gameState.food[foodid];
      if (food) {
        player.collisionWith(food, (player, f) => {
          if (food.eaten) {
            return;
          }
          scene.gameState.emit('food-eaten', food.id);
        });
      }
    }
  }
}

export function startFoodProcessing(scene, myplayer) {
  scene.gameState.on('create-food', (data) => {
    scene.gameState.emit('food-created', createFood(scene, data));
    createFoodCollision(scene, myplayer);
  });
}

export function clearFood(scene) {
  for (let foodid in scene.gameState.food) {
    let food = scene.gameState.food[foodid];
    if (food) {
      food.destroyObject();
    }
  }
}

export function recreateFood(scene) {
  for (let foodid in scene.gameState.food) {
    let food = scene.gameState.food[foodid];
    if (food) {
      food.createObject(scene);
    }
  }
}
