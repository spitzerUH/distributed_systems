import { Scene } from 'phaser';
import { createRoomDialog } from '+ui/dialogs';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  init(data) {
    this.connection = data.connection;
  }

  create() {
    createRoomDialog(this, {
      x: this.rexUI.viewport.centerX,
      y: this.rexUI.viewport.centerY,
      background_color: 0x4444ff,
      border_color: 0x000000,
      button_color: 0x2222ff
    }).on('enter', (roomCode) => {
      this.connection.enterRoom(roomCode).then(() => {
        this.scene.start('Game', { connection: this.connection });
      });
    }).on('observe', (roomCode) => {
      this.connection.enterRoom(roomCode).then(() => {
        this.scene.start('Game', { connection: this.connection, observer: true });
      });
    }).popUp(500);
  }
}
