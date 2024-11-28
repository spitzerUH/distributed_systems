import { Scene } from 'phaser';
import { initMainCamera } from '+cameras/main';
import { drawBorders } from '+ui/debug';
import { startFoodProcessing } from '+objects/food';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.gameState = data.gamestate;
  }

  create() {
    startFoodProcessing(this);
    this.clearOldObjects();
    const mainCamera = initMainCamera(this);

    this.scene.launch('UI', { gameState: this.gameState });
    this.cameras.main.setBackgroundColor(0x002200);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.physics.world.setBounds(0, 0, 1000, 1000);

    const bg = this.add.image(0, 0, "gradientBackground").setOrigin(0).setDepth(-2);
    bg.setDisplaySize(this.physics.world.bounds.width, this.physics.world.bounds.height);

    drawBorders(this, this.physics.world.bounds);

    let myplayer = this.createPlayer(this.gameState.players['player']);
    this.gameState.players['player'].object = myplayer;
    this.physics.add.existing(myplayer);
    myplayer.body.setCollideWorldBounds(true);
    mainCamera.startFollow(myplayer);

    this.dirr = undefined;

    this.gameState.on('player-joins', (playerid) => {
      let data = this.gameState.players[playerid];
      let player = this.createPlayer(data);
      this.gameState.players[playerid].object = player;
      if (data.observing || !data.status || data.status == 'dead') {
        player
          .setActive(false)
          .setVisible(false);
      }
      if (!this.gameState.players['player'].observing) {
        this.physics.add.overlap(
          myplayer,
          player,
          () => {
            this.gameState.emit('change-status', 'dead');
          }
        );
      }
      if (!this.gameState.players['player'].observing && this.gameState.players['player'].status == 'alive') {
        this.gameState.emit('change-status', 'alive');
      }
    });
    this.gameState.on('player-moves', (playerid, direction) => {
      let player = this.gameState.players[playerid].object;
      this.doMovement(player, direction);
    });
    this.gameState.on('player-leaves', (playerid) => {
      this.gameState.players[playerid].object.destroy();
    });
    this.gameState.on('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          let deadPlayer = this.gameState.players[playerid].object;
          deadPlayer.body.setVelocity(0);
          if (playerid == 'player') {
            this.generateSpawnpoint();
            this.scene.run('GameOver', { gameState: this.gameState });
          } else {
            deadPlayer
              .setActive(false)
              .setVisible(false);
          }
          break;
        case 'alive':
          let spawn = this.gameState.players[playerid].spawnpoint;
          let alivePlayer = this.gameState.players[playerid].object;
          alivePlayer
            .setActive(true)
            .setVisible(true)
            .setPosition(spawn.x, spawn.y);
          if (this.gameState.connection.isLeader && playerid !== 'player') {
            this.gameState.emit('send-food', playerid);
          }
          break;
      }
    });
    this.gameState.on('generate-food', (count) => {
      let food = [];
      for (let i = 0; i < count; i++) {
        let id = this.gameState.nextFoodIndex;
        let x = Phaser.Math.Between(0, this.physics.world.bounds.width);
        let y = Phaser.Math.Between(0, this.physics.world.bounds.height);
        let size = Phaser.Math.Between(5, 10);
        let color = Phaser.Display.Color.RandomRGB().color;
        food.push(
          {
            id: id,
            details: {
              x: x,
              y: y,
              size: size,
              color: color
            }
          });
      }
      this.gameState.emit('create-food', food);

    });

    if (this.gameState.players['player'].observing) {
      myplayer
        .setVisible(false)
        .setPosition(this.physics.world.bounds.width / 2, this.physics.world.bounds.height / 2);
    } else {
      this.generateSpawnpoint();
    }
    this.generateNewObjects();

    this.gameState.emit('ready');
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
    if (curDirr && curDirr != this.dirr) {
      this.doMovement(this.gameState.players['player'].object, curDirr);
      if (this.gameState.players['player'].observing)
        return;
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

  createPlayer(data) {
    let player = this.add.circle(
      (data.spawnpoint?.x || 0),
      (data.spawnpoint?.y || 0),
      10,
      data.color
    );
    this.physics.add.existing(player);
    return player;
  }

  generateSpawnpoint() {
    let randomPoint = this.physics.world.bounds.getRandomPoint();
    let spawnpoint = { x: randomPoint.x, y: randomPoint.y };
    this.gameState.emit('spawnpoint', spawnpoint);
  }

  clearOldObjects() {
    for (let playerid in this.gameState.players) {
      let player = this.gameState.players[playerid].object;
      if (player) {
        player.destroy();
        this.gameState.players[playerid].object = undefined;
      }
    }
  }

  generateNewObjects() {
    for (let playerid in this.gameState.players) {
      if (this.gameState.players[playerid].object) {
        continue;
      }
      let playerData = this.gameState.players[playerid];
      let player = this.createPlayer(playerData);
      this.gameState.players[playerid].object = player;
      this.physics.add.existing(player);
      if (playerData.observing || !playerData.status || playerData.status == 'dead') {
        player
          .setActive(false)
          .setVisible(false);
      } else {
        if (playerid !== "player") {
          this.physics.add.overlap(
            this.gameState.players["player"].object,
            player,
            () => {
              this.gameState.emit('change-status', 'dead');
            }
          )

        }
        player
          .setActive(true)
          .setVisible(true);

      }
    }
  }

}
