import { Scene } from 'phaser';

export class GameOver extends Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.connection = data.connection;
  }

  create() {
    this.cameras.main.setBackgroundColor(0xff0000);

    var viewport = this.rexUI.viewport;
    this.rexUI.add.BBCodeText(viewport.left, viewport.centerY, 'Game over, try again?', { color: '#fff', fontSize: 64 });

    this.input.once('pointerdown', () => {
      this.scene.start('Game', { connection: this.connection });
    });
  }
}
