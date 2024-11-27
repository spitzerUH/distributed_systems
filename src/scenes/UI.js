import { Scene } from 'phaser';
import { createDebugTextField } from '+ui/debug';
import { createPlayerList } from '+ui/playerlist';
import { createJoinButton, createKOButton } from '+ui/misc';
import { createMiniMap } from '+cameras/minimap';

export class UI extends Scene {
  constructor() {
    super('UI');
  }

  init(data) {
    this.gameState = data.gameState;
  }

  create() {
    var minimap = createMiniMap(this, this.scene.get('Game'));
    this.input.keyboard.addKey('ESC').on('down', (event) => {
      this.gameState.emit('leave');
      this.scene.stop('Game').stop('UI').run('MainMenu', { connection: this.gameState.connection });
    });

    this.debugFields = createDebugTextField(this, this.gameState.connection, this.gameState.observer);
    this.gameState.on('move', (direction) => {
      this.debugFields.emit('move', direction);
    });

    var playerList = createPlayerList(this, {});

    playerList.emit('join', 'player', this.gameState.players['player']);
    this.gameState.on('player-joins', (playerid) => {
      playerList.emit('join', playerid, this.gameState.players[playerid]);
    });
    this.gameState.on('player-leaves', (playerid) => {
      playerList.emit('leave', playerid);
    });

    if (this.gameState.players['player'].observing) {
      var joinButton = createJoinButton(this);
      joinButton.on('pointerdown', () => {
        this.gameState.players['player'].observing = false;
        this.scene.stop().start('Game', { gamestate: this.gameState });
      });
    } else {
      let ko = createKOButton(this);
      ko.on('pointerdown', () => {
        this.gameState.emit('change-status', 'dead');
      });
    }
  }
}
