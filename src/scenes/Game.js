import { Scene } from 'phaser';
import { initMainCamera } from '+cameras/main';
import { drawBorders } from '+ui/debug';
import { clearFood, recreateFood, startFoodProcessing } from '+objects/food';

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

    let myplayer = this.gameState.players['player'];
    myplayer.createObject(this);
    myplayer.follow(mainCamera);

    this.dirr = undefined;

    this.gameState.on('player-joins', (playerid) => {
      let player = this.gameState.players[playerid];
      if (player) {
        player.createObject(this);
        if (player._observing || !player._status || player._status == 'dead') {
          player.hide();
        }
        if (!this.gameState.players['player']._observing) {
          player.collisionWith(myplayer, () => {
            this.gameState.emit('change-status', 'dead');
          });
        }
        if (!this.gameState.players['player']._observing && this.gameState.players['player']._status == 'alive') {
          this.gameState.emit('change-status', 'alive');
        }
      }
    });
    this.gameState.on('player-moves', (playerid, direction) => {
      let player = this.gameState.players[playerid];
      player.move(direction);
    });
    this.gameState.on('player-leaves', (playerid) => {
      this.gameState.players[playerid].resetObject();
    });
    this.gameState.on('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          let deadPlayer = this.gameState.players[playerid];
          deadPlayer.object.body.setVelocity(0);
          if (playerid == 'player') {
            this.generateSpawnpoint();
            this.scene.run('GameOver', { gameState: this.gameState });
          } else {
            deadPlayer.hide();
          }
          break;
        case 'alive':
          if (this.gameState.players[playerid]) {
            let spawn = this.gameState.players[playerid]._position;
            let alivePlayer = this.gameState.players[playerid];
            alivePlayer.show();
            alivePlayer.object
              .setPosition(spawn.x, spawn.y);
          }
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

    if (this.gameState.players['player']._observing) {
      myplayer.object
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
      this.gameState.players['player'].move(curDirr);
      if (this.gameState.players['player']._observing)
        return;
      this.gameState.emit('move', curDirr);
    }
  }

  generateSpawnpoint() {
    let randomPoint = this.physics.world.bounds.getRandomPoint();
    let spawnpoint = { x: randomPoint.x, y: randomPoint.y };
    this.gameState.emit('spawnpoint', spawnpoint);
  }

  clearOldObjects() {
    for (let playerid in this.gameState.players) {
      this.gameState.players[playerid].resetObject();
    }
    clearFood(this);
  }

  generateNewObjects() {
    for (let playerid in this.gameState.players) {
      if (this.gameState.players[playerid].object) {
        continue;
      }
      let player = this.gameState.players[playerid];
      player.createObject(this);
      if (player._observing || !player._status || player._status == 'dead') {
        player.hide();
      } else {
        if (playerid !== "player") {
          this.gameState.players["player"].collisionWith(player, () => {
            this.gameState.emit('change-status', 'dead');
          });
        }
        player.show();

      }
    }
    recreateFood(this);
  }

}
