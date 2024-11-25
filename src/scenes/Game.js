import { Scene } from 'phaser';
import { createPlayerList } from '+ui/playerlist';
import { initMainCamera } from '+cameras/main';
import { createMiniMap } from '+cameras/minimap';
import { createDebugTextField, drawBorders } from '+ui/debug';
import { createJoinButton, createKOButton } from '+ui/misc';
import { GameState } from '+logic/gamestate';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.gameState = new GameState(data);
    this.connection = data.connection;
    this.observer = !!data.observer;
    this.playerName = JSON.parse(localStorage.getItem('player-name')) || 'You';
    this.playerColor = JSON.parse(localStorage.getItem('player-color')) || 0x000000;
  }

  create() {
    this.scene.launch('UI', { gameState: this.gameState });
    this.cameras.main.setBackgroundColor(0x002200);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.physics.world.setBounds(0, 0, 1000, 1000);

    const bg = this.add.image(0,0, "gradientBackground").setOrigin(0).setDepth(-2);
    bg.setDisplaySize(this.physics.world.bounds.width, this.physics.world.bounds.height);

    const mainCamera = initMainCamera(this);
    const miniMapCamera = createMiniMap(this);

    const playerStartingX = this.physics.world.bounds.width / 2;
    const playerStartingY = this.physics.world.bounds.height / 2;
    drawBorders(this, this.physics.world.bounds);

    this.player = this.add.circle(
      playerStartingX,
      playerStartingY,
      10,
      this.playerColor
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    mainCamera.startFollow(this.player);

    if (this.observer) {
      this.player.setVisible(false);
      var joinButton = createJoinButton(this);
      miniMapCamera.ignore(joinButton);
      joinButton.on('pointerdown', () => {
        this.scene.restart({ connection: this.connection });
      });
    }

    this.debugFields = createDebugTextField(this, this.connection, this.observer);
    miniMapCamera.ignore(this.debugFields);

    this.dirr = undefined;
    this.dirrSending = false;


    var playerList = createPlayerList(this, {});
    miniMapCamera.ignore(playerList);
    playerList.emit('join', 'player', this.playerName);
    this.connection.gameDCClose = (playerid) => {
      playerList.emit('leave', playerid);
      this.players[playerid].destroy();
      delete this.players[playerid];
    };

    this.players = {};

    this.connection.openDataChannel = (playerid) => {
    }

    this.connection.receivedMessage = (playerid, message) => {
      console.log(message);
      let player = this.players[playerid];
      if (!player) {
        player = this.add.circle(
          playerStartingX,
          playerStartingY,
          10,
          0x000000
        );
        this.physics.add.existing(player);
        this.players[playerid] = player;
        playerList.emit('join', playerid, playerid);
      }
      if (!!message.moving) {
        let command = message.moving;
        switch (command) {
          case "left":
            player?.body.setVelocity(-100, 0);
            break;
          case "right":
            player?.body.setVelocity(100, 0);
            break;
          case "up":
            player?.body.setVelocity(0, -100);
            break;
          case "down":
            player?.body.setVelocity(0, 100);
            break;
        }
      } else if (!!message.status) {
        switch (message.status) {
          case 'dead':
            this.players[playerid].setActive(false).setVisible(false).body.setVelocity(0);
            break;
          case 'alive':
            this.players[playerid].setActive(true).setVisible(true)
              .setPosition(this.rexUI.viewport.centerX, this.rexUI.viewport.centerY);
            break;
        }
      }
    };

    if (!this.observer) {
      let ko = createKOButton(this);
      ko.on('pointerdown', () => {
        this.connection.sendMessage({ status: 'dead' }).then(() => {
          this.scene.start('GameOver', { connection: this.connection, players: this.players });
        });
      });
      this.connection.sendMessage({ status: 'alive' });
    }
  }

  update(time, delta) {
    var curDirr = undefined;
    if (this.cursors.left.isDown) {
      curDirr = "left";
      this.player.body.setVelocity(-100, 0);
    } else if (this.cursors.right.isDown) {
      curDirr = "right";
      this.player.body.setVelocity(100, 0);
    } else if (this.cursors.up.isDown) {
      curDirr = "up";
      this.player.body.setVelocity(0, -100);
    } else if (this.cursors.down.isDown) {
      curDirr = "down";
      this.player.body.setVelocity(0, 100);
    }
    if (this.observer)
      return;
    if (curDirr && curDirr != this.dirr) {
      this.gameState.emit('move', curDirr);
      this.sendMovement(curDirr);
    }
  }

  sendMovement(movement) {
    if (!this.dirrSending) {
      this.dirrSending = true;
      this.connection.sendMessage({ moving: movement }).then(() => {
        this.dirr = movement;
        this.dirrSending = false;
      });
    }
  }
}
