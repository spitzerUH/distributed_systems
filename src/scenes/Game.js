import { Scene } from 'phaser';
import { createPlayerList } from '+ui/playerlist';
import { initMainCamera } from '+cameras/main';
import { createMiniMap } from '+cameras/minimap';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.connection = data.connection;
    this.observer = !!data.observer;
    this.playerName = JSON.parse(localStorage.getItem('player-name')) || 'You';
    this.playerColor = JSON.parse(localStorage.getItem('player-color')) || 0x000000;
  }

  create() {
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.keyboard.addKey('ESC').on('down', (event) => {
      this.connection.exitRoom().then(() => {
        this.scene.start('MainMenu', { connection: this.connection });
      });
    });

    this.add.image(this.rexUI.viewport.centerX, this.rexUI.viewport.centerY, "gradientBackground").setDepth(-2);
    var viewport = this.rexUI.viewport;

    const mainCamera = initMainCamera(this);
    const miniMapCamera = createMiniMap(this);

    this.player = this.add.circle(
      viewport.centerX,
      viewport.centerY,
      10,
      this.playerColor
    );
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    mainCamera.startFollow(this.player);

    if (this.observer) {
      this.player.setVisible(false);

      var joinButton = this.rexUI.add.label({
        orientation: 'x',
        background: this.rexUI.add.roundRectangle(0, 0, 10, 10, 10, 0x2222ff),
        text: this.add.text(0, 0, 'Join the game'),
        space: { top: 8, bottom: 8, left: 8, right: 8 }
      })
        .layout()
        .setScrollFactor(0, 0)
        .setDepth(100)
        .setInteractive()
        .on('pointerdown', () => {
          this.scene.restart({ connection: this.connection });
        });
      let obX = this.rexUI.viewport.left + Math.floor(joinButton.width / 2);
      let obY = this.rexUI.viewport.bottom - Math.floor(joinButton.height / 2);
      joinButton.setPosition(obX, obY);
      miniMapCamera.ignore(joinButton);
    }

    this.addDebugTextField();
    miniMapCamera.ignore(this.gameinfo);

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
          viewport.centerX,
          viewport.centerY,
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

    this.add.text((viewport.right - 100), (viewport.bottom - 100), 'KO!', { fontSize: 64, color: "red" })
      .setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains)
      .on('pointerdown', () => {
        this.connection.sendMessage({ status: 'dead' }).then(() => {
          this.scene.start('GameOver', { connection: this.connection, players: this.players });
        });
      })
      .setScrollFactor(0, 0)
      .setDepth(100);
    this.connection.sendMessage({ status: 'alive' });
  }

  update(time, delta) {
    var curDirr = undefined;
    if (this.cursors.left.isDown) {
      this.direction?.setText("left");
      curDirr = "left";
      this.player.body.setVelocity(-100, 0);
    } else if (this.cursors.right.isDown) {
      this.direction?.setText("right");
      curDirr = "right";
      this.player.body.setVelocity(100, 0);
    } else if (this.cursors.up.isDown) {
      this.direction?.setText("up");
      curDirr = "up";
      this.player.body.setVelocity(0, -100);
    } else if (this.cursors.down.isDown) {
      this.direction?.setText("down");
      curDirr = "down";
      this.player.body.setVelocity(0, 100);
    }
    if (this.observer)
      return;
    if (curDirr && curDirr != this.dirr) {
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

  addDebugTextField() {
    var background = this.add.rectangle(0, 0, 10, 10, 0x000000);

    this.roominfo = this.rexUI.add.BBCodeText(
      0,
      0,
      `Room: ${this.connection.room}`,
      { color: "#fff", fontSize: "12px" }
    );

    this.gameinfo = this.rexUI.add
      .sizer({
        x: 0,
        y: 10,
        orientation: "x",
      })
      .addBackground(background)
      .add(
        this.roominfo,
        0,
        "left",
        { left: 10, right: 10, top: 5, bottom: 5 },
        true
      )
      .setScrollFactor(0, 0);
    if (this.observer) {
      this.gameinfo.add(
        this.add.text(0, 0, 'Observer'),
        0,
        'left',
        { left: 10, right: 10, top: 5, bottom: 5 },
        true
      );
    } else {
      this.direction = this.add.text(0, 0, "direction", { fontSize: "12px" });
      this.gameinfo.add(
        this.direction,
        0,
        "left",
        { left: 10, right: 10, top: 5, bottom: 5 },
        true
      );
    }
    this.gameinfo.layout();

    let x = this.rexUI.viewport.left + Math.floor(this.gameinfo.width / 2);
    let y = this.rexUI.viewport.top + Math.floor(this.gameinfo.height / 2);
    this.gameinfo.setPosition(x, y);
    this.gameinfo.setDepth(100);
  }
}
