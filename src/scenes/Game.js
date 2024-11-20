import { Scene } from 'phaser';
import { createPlayerList } from '+ui/playerlist';

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

    var viewport = this.rexUI.viewport;
    this.player = this.add.circle(
      viewport.centerX,
      viewport.centerY,
      10,
      this.playerColor
    );

    this.physics.add.existing(this.player);
    if (this.observer) {
      this.player.setVisible(false);
    }

    this.mainCamera = this.initMainCamera();
    this.miniMapCamera = this.initMiniMap();

    this.addDebugTextField();

    this.dirr = undefined;
    this.dirrSending = false;

    var playerList = createPlayerList(this, {});
    this.miniMapCamera.ignore(playerList);
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
      let command = message.moving;
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
      switch (command) {
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
          break;
      }
    };
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

  initMainCamera() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const gradientTexture = this.textures.createCanvas(
      "gradientBackground",
      width,
      height
    );

    const ctx = gradientTexture.getSourceImage().getContext("2d");

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );

    gradient.addColorStop(0, "#00ff00");
    gradient.addColorStop(1, "#002200");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    gradientTexture.refresh();

    this.add.image(0, 0, "gradientBackground").setOrigin(0).setDepth(-2);

    const mainCamera = this.cameras.main;

    mainCamera.setBounds(0, 0, width, height);
    mainCamera.startFollow(this.player);
    mainCamera.setZoom(3);

    this.physics.world.setBounds(0, 0, width, height);
    this.player.body.setCollideWorldBounds(true);

    return mainCamera;
  }

  initMiniMap() {
    const miniMapFactor = 0.2;
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const miniMapWidth = width * miniMapFactor;
    const miniMapHeight = height * miniMapFactor;

    const miniMapCamera = this.cameras.add(
      width - miniMapWidth,
      height - miniMapHeight,
      width,
      height,
      false,
      "miniMap"
    );
    miniMapCamera.setZoom(miniMapFactor);
    miniMapCamera.setBounds(0, 0, width, height);

    return miniMapCamera;
  }

  addDebugTextField() {
    var background = this.add.rectangle(0, 0, 10, 10, 0x000000);

    this.roominfo = this.rexUI.add.BBCodeText(
      0,
      0,
      `Room: ${this.connection.room}`,
      { color: "#fff", fontSize: "12px" }
    );
    this.direction = this.add.text(0, 0, "direction", { fontSize: "12px" });

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
      .add(
        this.direction,
        0,
        "left",
        { left: 10, right: 10, top: 5, bottom: 5 },
        true
      )
      .layout()
      .setScrollFactor(0, 0);

    let x = this.rexUI.viewport.left + Math.floor(this.gameinfo.width / 2);
    let y = this.rexUI.viewport.top + Math.floor(this.gameinfo.height / 2);
    this.gameinfo.setPosition(x, y);
    this.gameinfo.setDepth(100);
    this.miniMapCamera.ignore(this.gameinfo);
  }
}
