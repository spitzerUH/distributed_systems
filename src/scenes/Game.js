import { Scene } from 'phaser';
import { initMainCamera } from '+cameras/main';
import { drawBorders } from '+ui/debug';
import { clearFood, generateFood, recreateFood, startFoodProcessing, generateFood } from '+objects/food';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.coordinator = data.coordinator;
    this.gameState = this.coordinator.gameState;
  }

  create() {
    this.physics.world.setBounds(0, 0, 1000, 1000);
    this.coordinator.setBounds(this.physics.world.bounds);
    this.coordinator.setGameScene(this);
    this.clearOldObjects();
    const mainCamera = initMainCamera(this);

    this.scene.launch('UI', { coordinator: this.coordinator });
    this.cameras.main.setBackgroundColor(0x002200);
    this.cursors = this.input.keyboard.createCursorKeys();

    const bg = this.add.image(0, 0, "gradientBackground").setOrigin(0).setDepth(-2);
    bg.setDisplaySize(this.physics.world.bounds.width, this.physics.world.bounds.height);

    drawBorders(this, this.physics.world.bounds);

    let myplayer = this.gameState.players['player'];
    myplayer.createObject(this);
    myplayer.follow(mainCamera);

    startFoodProcessing(this, myplayer);

    this.dirr = undefined;

    this.gameState.on('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          let deadPlayer = this.gameState.players[playerid];
          deadPlayer.stop();
          deadPlayer.hide();
          if (playerid == 'player') {
            this.coordinator.generateSpawnpoint();
            this.scene.run('GameOver', { coordinator: this.coordinator });
          }
          break;
        case 'alive':
          if (this.gameState.players[playerid]) {
            this.gameState.players[playerid].respawn();
          }
          if (this.gameState.connection.isLeader && playerid !== 'player') {
            this.gameState.emit('send-food', playerid);
          }
          break;
      }
    });
    this.gameState.on('generate-food', (count) => {
      let foodData = generateFood(this, count);
      this.gameState.emit('create-food', foodData);

    });

    if (this.gameState.players['player']._observing) {
      let x = this.physics.world.bounds.width / 2;
      let y = this.physics.world.bounds.height / 2;
      myplayer.observe(x, y);
    } else {
      this.coordinator.generateSpawnpoint();
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
      this.coordinator.movePlayer(curDirr);
    }
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
            if (this.gameState.players["player"]._status == 'alive' && player._status == 'alive') {
              this.gameState.emit('change-status', 'dead');
            }
          });
        }
        player.show();

      }
    }
    recreateFood(this);
  }

}
