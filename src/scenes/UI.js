import { Scene } from 'phaser';
import { createDebugTextField } from '+ui/debug';
import { createPlayerList } from '+ui/playerlist';
import { createJoinButton, createKOButton } from '+ui/misc';

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
      this.gameState.emit('leave');
      this.scene.stop('Game').stop('UI').run('MainMenu', { connection: this.gameState.connection });
    });

    this.debugFields = createDebugTextField(this, this.gameState.connection, this.gameState.observer);
    this.gameState.on('move', (direction) => {
      this.debugFields.emit('move', direction);
    });

    var playerList = createPlayerList(this, {});
    playerList.emit('join', 'player', this.playerName);
    this.gameState.on('player-joins', (playerid, playername) => {
      playerList.emit('join', playerid, playername);
    });
    this.gameState.on('player-leaves', (playerid) => {
      playerList.emit('leave', playerid);
    });

    if (this.gameState.observer) {
      //var joinButton =
      createJoinButton(this);
      //miniMapCamera.ignore(joinButton);
      //joinButton.on('pointerdown', () => {
      //  this.scene.restart({ connection: this.connection });
      //});
    } else {
      let ko = createKOButton(this);
      ko.on('pointerdown', () => {
        this.gameState.emit('change-status', 'dead');
      });
    }
  }
}
