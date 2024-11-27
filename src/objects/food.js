import Hexagon from 'phaser3-rex-plugins/plugins/hexagon.js';

export class Food extends Hexagon {
  constructor(scene, x, y, size, color) {
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
    scene.physics.add.overlap(
      scene.gameState.players['player'].object,
      this.graphics,
      (player, food) => {
        food.destroy();
        scene.gameState.emit('food-eaten', { x: x, y: y, size: size, color: color });
      });
  }
}

export function startFoodProcessing(scene) {
  scene.gameState.on('create-food', (data) => {
    data.food.forEach(food => {
      new Food(scene, food.x, food.y, food.size, food.color);
    });
  });
}
