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

    this.debugFields = createDebugTextField(this, this.coordinator);
    this.coordinator.bindEvent('move', (direction) => {
      this.debugFields.emit('move', direction);
    });

    var playerList = createPlayerList(this, {});

    this.coordinator.myplayer.then((myplayer) => {
      playerList.emit('join', myplayer._id, myplayer);
    });
    this.coordinator.bindEvent('player-joins', (playerid) => {
      this.coordinator.getPlayer(playerid).then((player) => {
        playerList.emit('join', playerid, player);
      });
    });
    this.coordinator.bindEvent('leader-change', (playerid) => {
      playerList.emit('leader-change', playerid)
    })
    this.coordinator.bindEvent('player-leaves', (playerid) => {
      playerList.emit('leave', playerid);
    });

    if (this.coordinator.observer) {
      var joinButton = createJoinButton(this);
      joinButton.on('pointerdown', () => {
        this.coordinator.observer = false;
        this.scene.stop().start('Game', { coordinator: this.coordinator });
      });
    }
  }
}
