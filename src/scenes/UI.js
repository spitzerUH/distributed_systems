import { Scene } from 'phaser';
import { createDebugTextField } from '+ui/debug';
import { createPlayerList } from '+ui/playerlist';
import { createJoinButton } from '+ui/misc';
import { createMiniMap } from '+cameras/minimap';

export class UI extends Scene {
  constructor() {
    super('UI');
  }

  init(data) {
    this.coordinator = data.coordinator;
  }

  create() {
    var minimap = createMiniMap(this, this.scene.get('Game'));
    this.input.keyboard.addKey('ESC').on('down', (event) => {
      this.coordinator.leaveRoom().then(() => {
        this.scene.stop('Game').stop('UI').run('MainMenu', { coordinator: this.coordinator });
      });
    });

    this.debugFields = createDebugTextField(this, this.coordinator._gameState.connection, this.coordinator._gameState.observer);
    this.coordinator._gameState.on('move', (direction) => {
      this.debugFields.emit('move', direction);
    });

    var playerList = createPlayerList(this, {});

    let myplayer = this.coordinator.myplayer;
    playerList.emit('join', myplayer.id, myplayer);
    this.coordinator._gameState.on('player-joins', (playerid) => {
      playerList.emit('join', playerid, this.coordinator._gameState.players[playerid]);
    });
    this.coordinator._gameState.on('player-leaves', (playerid) => {
      playerList.emit('leave', playerid);
    });

    if (this.coordinator.myplayer._observing) {
      var joinButton = createJoinButton(this);
      joinButton.on('pointerdown', () => {
        this.coordinator.myplayer._observing = false;
        this.scene.stop().start('Game', { coordinator: this.coordinator });
      });
    }
  }
}
