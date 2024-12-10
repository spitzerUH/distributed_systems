import { Scene } from 'phaser';
import { createRoomDialog } from '+ui/dialogs';

export class MainMenu extends Scene {
  constructor() {
    super('MainMenu');
  }

  init(data) {
    this.coordinator = data.coordinator;
  }

  create() {
    createRoomDialog(this, {
      x: this.rexUI.viewport.centerX,
      y: this.rexUI.viewport.centerY,
      background_color: 0x4444ff,
      border_color: 0x000000,
      button_color: 0x2222ff
    }).on('enter', (roomCode) => {
      this.coordinator.joinRoom(roomCode).then(() => {
        this.scene.start('Game', { coordinator: this.coordinator });
      });
    }).on('observe', (roomCode) => {
      this.coordinator.observe(roomCode).then(() => {
        this.scene.start('Game', { coordinator: this.coordinator });
      });
    }).popUp(500);
  }
}
