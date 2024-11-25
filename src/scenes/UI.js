import { Scene } from 'phaser';
import { createDebugTextField } from '+ui/debug';

export class UI extends Scene {
  constructor() {
    super('UI');
  }

  init(data) {
    this.gameState = data.gameState;
    this.playerName = JSON.parse(localStorage.getItem('player-name')) || 'You';
    this.playerColor = JSON.parse(localStorage.getItem('player-color')) || 0x000000;
  }

  create() {
    this.input.keyboard.addKey('ESC').on('down', (event) => {
      this.connection.exitRoom().then(() => {
        this.scene.stop('Game').run('MainMenu', { connection: this.gameState.connection });
      });
    });

    this.debugFields = createDebugTextField(this, this.gameState.connection, this.gameState.observer);
    this.gameState.on('move', (direction) => {
      this.debugFields.emit('move', direction);
    });
  }
}
