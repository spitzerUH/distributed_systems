import { Scene } from 'phaser';
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

    //miniMapCamera.ignore(this.debugFields);

    this.dirr = undefined;
    this.dirrSending = false;


    //miniMapCamera.ignore(playerList);

    var playerObjects = {};
    this.gameState.on('player-joins', (playerid, playerName) => {
      console.log(playerid, playerName);
      let player = this.add.circle(
        playerStartingX,
        playerStartingY,
        10,
        0x000000
      );
      this.physics.add.existing(player);
      playerObjects[playerid] = player;
    });
    this.gameState.on('player-moves', (playerid, direction) => {
      let player = playerObjects[playerid];
      this.doMovement(player, direction);
    });
    this.gameState.on('player-leaves', (playerid) => {
      playerObjects[playerid].destroy();
      delete playerObjects[playerid];
    });

    this.connection.receivedMessage = (playerid, message) => {
      console.log(message);
      let player = this.players[playerid];
      if (!!message.status) {
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
    } else if (this.cursors.right.isDown) {
      curDirr = "right";
    } else if (this.cursors.up.isDown) {
      curDirr = "up";
    } else if (this.cursors.down.isDown) {
      curDirr = "down";
    }
    if (this.observer)
      return;
    if (curDirr && curDirr != this.dirr) {
      this.doMovement(this.player, curDirr);
      this.gameState.emit('move', curDirr);
    }
  }

  doMovement(player, movement) {
    switch (movement) {
      case "left":
        player.body.setVelocity(-100, 0);
        break;
      case "right":
        player.body.setVelocity(100, 0);
        break;
      case "up":
        player.body.setVelocity(0, -100);
        break;
      case "down":
        player.body.setVelocity(0, 100);
        break
    }
  }

}
