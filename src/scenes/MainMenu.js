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
    const screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    const screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;

    var roomDialog = createRoomDialog(this, {
      x: screenCenterX,
      y: screenCenterY,
      background_color: 0x4444ff,
      border_color: 0x000000,
      button_color: 0x2222ff
    }).on('enter', (roomCode) => {
      this.connection.enterRoom(roomCode).then(() => {
        this.scene.start('Game', { connection: this.connection });
      });
    }).popUp(500);
  }
}
