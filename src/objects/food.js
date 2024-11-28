import Hexagon from 'phaser3-rex-plugins/plugins/hexagon.js';

class Food extends Hexagon {
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
    if (!scene.gameState.players['player'].observing) {
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
      new Food(scene, food);
    });
  });
}
