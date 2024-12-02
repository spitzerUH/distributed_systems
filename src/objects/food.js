import Hexagon from 'phaser3-rex-plugins/plugins/hexagon.js';

class Food {
  constructor(data) {
    this._id = data.id;
    this._details = data.details;
    this._object = undefined;
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
        this._object.destroy();
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
          resolve(this._id);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

class FoodH extends Hexagon {
  constructor(scene, data) {
    let id = data.id;
    let details = data.details;
    let x = details.x;
    let y = details.y;
    let size = details.size;
    let color = details.color;
    super(0, 0, size, color);
    this.graphics = scene.add.graphics()
      .fillStyle(color)
      .fillPoints(this.points)
      .setInteractive(this, Phaser.Geom.Polygon.Contains)
      .setPosition(x, y);
    scene.add.existing(this.graphics);
    scene.physics.add.existing(this.graphics);
    this.graphics.body.setCircle(size, -size, -size);
    this.graphics.body.setImmovable(true);
    let foodData = {
      id: id,
      details: details,
      object: this.graphics
    };
    if (!scene.gameState.players['player']._observing) {
      scene.physics.add.overlap(
        scene.gameState.players['player'].object,
        this.graphics,
        (player, food) => {
          scene.gameState.emit('food-eaten', id);
        });
    }
    scene.gameState.emit('food-created', foodData);
  }
}

export function startFoodProcessing(scene) {
  scene.gameState.on('create-food', (data) => {
    data.forEach(food => {
      new FoodH(scene, food);
    });
  });
}

export function clearFood(scene) {
  for (let foodid in scene.gameState.food) {
    let food = scene.gameState.food[foodid].object;
    if (food) {
      food.destroy();
      scene.gameState.food[foodid].object = undefined;
    }
  }
}

export function recreateFood(scene) {
  for (let foodid in scene.gameState.food) {
    let food = scene.gameState.food[foodid];
    if (food.object) {
      continue;
    }
    new FoodH(scene, food);
  }
}
