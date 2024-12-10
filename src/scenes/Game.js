import { Scene } from 'phaser';
import { drawBorders } from '+ui/debug';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.coordinator = data.coordinator;
  }

  create() {
    this.scene.launch('UI', { coordinator: this.coordinator });

    this.physics.world.setBounds(0, 0, 1000, 1000);
    this.coordinator.setBounds(this.physics.world.bounds);
    this.coordinator.setGameScene(this);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.setBackgroundColor(0x002200);
    const bg = this.add.image(0, 0, "gradientBackground").setOrigin(0).setDepth(-2);
    bg.setDisplaySize(this.physics.world.bounds.width, this.physics.world.bounds.height);

    drawBorders(this, this.physics.world.bounds);

    this.coordinator.gameReady();
  }

  update(time, delta) {
    this.coordinator.handleInput(time, delta, this.cursors);
  }

}
