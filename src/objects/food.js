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
  }

  isEatenBy(player) {
    console.log('Food eaten by player');
    this.graphics.destroy();
  }

  addCollision(scene, player) {
    scene.physics.add.overlap(player, this.graphics, (player, food) => {
      this.isEatenBy(player);
    });
  }
}

export function generateFood(scene, count, myplayer) {
  let genfood = [];
  for (let i = 0; i < count; i++) {
    let x = Phaser.Math.Between(0, scene.physics.world.bounds.width);
    let y = Phaser.Math.Between(0, scene.physics.world.bounds.height);
    let size = Phaser.Math.Between(5, 10);
    let color = Phaser.Display.Color.RandomRGB().color;
    let food = new Food(scene, x, y, size, color);
    food.addCollision(scene, myplayer);
    genfood.push(food);
  }
  return genfood;
}
