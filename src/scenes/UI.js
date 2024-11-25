import { Scene } from 'phaser';

export class UI extends Scene {
  constructor() {
    super('UI');
  }

  init(data) {
    this.connection = data.connection;
    this.observer = !!data.observer;
    this.playerName = JSON.parse(localStorage.getItem('player-name')) || 'You';
    this.playerColor = JSON.parse(localStorage.getItem('player-color')) || 0x000000;
  }

  create() {
    this.input.keyboard.addKey('ESC').on('down', (event) => {
      this.connection.exitRoom().then(() => {
        this.scene.stop('Game').run('MainMenu', { connection: this.connection });
      });
    });
  }
}
