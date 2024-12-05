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
        resolve(this._id);
      } catch (error) {
        reject(error);
      }
    });
  }
  eat() {
    return new Promise((resolve, reject) => {
      if (this._eaten) {
        reject('Food already eaten');
      } else {
        this._eaten = true;
        this._object.setVisible(false);
        resolve(this._id);
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

function createFoodCollision(coordinator) {
  if (coordinator.observer) {
    return;
  }
  coordinator.myplayer.then((player) => {
    if (player.object && player.object.body) {
      for (let foodid in coordinator.food) {
        coordinator.getFood(foodid).then((food) => {
          player.collisionWith(food, (...args) => {
            food.eat().then((id) => {
              coordinator.fireEvent('food-eaten', id);
            }).catch((error) => {
              console.error(error);
            });
          });
        });
      }
    }
  });
}

export function generateFood(scene, coordinator, count) {
  let gameState = coordinator._gameState;
  let foodData = [];
  for (let i = 0; i < count; i++) {
    let id = gameState.nextFoodIndex;
    let x = Phaser.Math.Between(0, scene.physics.world.bounds.width);
    let y = Phaser.Math.Between(0, scene.physics.world.bounds.height);
    let size = Phaser.Math.Between(5, 10);
    let color = Phaser.Display.Color.RandomRGB().color;
    foodData.push(
      {
        id: id,
        details: {
          x: x,
          y: y,
          size: size,
          color: color
        }
      }
    );
  }
  return foodData;
}

export function startFoodProcessing(scene, coordinator) {
  coordinator.bindEvent('create-food', (data) => {
    coordinator.fireEvent('food-created', createFood(scene, data));
    createFoodCollision(coordinator);
  });
}

export function recreateFood(scene, coordinator) {
  for (let foodid in coordinator.food) {
    coordinator.getFood(foodid).then((food) => {
      food.destroyObject();
      food.createObject(scene);
    });
  }
  createFoodCollision(coordinator);
}
