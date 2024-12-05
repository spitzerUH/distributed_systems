import { Scene } from 'phaser';
import { initMainCamera } from '+cameras/main';
import { drawBorders } from '+ui/debug';
import { clearFood, recreateFood, startFoodProcessing } from '+objects/food';

export class Game extends Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.coordinator = data.coordinator;
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

    this.coordinator.myplayer.then((myplayer) => {
      myplayer.createObject(this);
      myplayer.follow(mainCamera);
      if (this.coordinator.observer) {
        let x = this.physics.world.bounds.width / 2;
        let y = this.physics.world.bounds.height / 2;
        myplayer.observe(x, y);
      } else {
        this.coordinator.generateSpawnpoint();
      }
    });

    startFoodProcessing(this, this.coordinator);

    this.dirr = undefined;


    this.generateNewObjects();

    this.coordinator.fireEvent('ready');
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
      this.coordinator.myplayer.then((myplayer) => {
        myplayer.move({curDirr, x:myplayer.object.x, y:myplayer.object.y});
        if (this.coordinator.observer)
          return;
        this.coordinator.movePlayer({curDirr, x:myplayer.object.x, y: myplayer.object.y});
      });
    }
  }

  clearOldObjects() {
    for (let playerid in this.coordinator.players) {
      this.coordinator.getPlayer(playerid).then((player) => {
        player.removeObject();
      });
    }
    clearFood(this.coordinator);
  }

  generateNewObjects() {
    for (let playerid in this.coordinator.players) {
      this.coordinator.getPlayer(playerid).then((player) => {
        if (player.object) {
          return;
        }
        player.createObject(this);
        if (player.observing || player.dead) {
          player.hide();
        } else {
          if (playerid !== "player") {
            this.coordinator.myplayer.then((myplayer) => {
              myplayer.collisionWith(player, () => {
                if (myplayer.alive && player.alive) {
                  this.coordinator.fireEvent('change-status', 'dead');
                }
              });
            });
          }
          player.show();
        }
      });
    }
    recreateFood(this, this.coordinator);
  }

}
