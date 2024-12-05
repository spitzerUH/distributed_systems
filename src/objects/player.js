class Player {
  constructor(data) {
    this._id = data.id;
    this._name = data.name;
    this._color = data.color || 0x000000;
    this._observing = data.observing;
    this._position = data.position || { x: 0, y: 0 };
    this._status = data.status;
    this._object = undefined;
    this._myplayer = !!data.myplayer;
  }
  get id() {
    return this._id;
  }
  get name() {
    return this._name;
  }
  get isMyplayer() {
    return this._myplayer;
  }
  get observing() {
    return this._observing;
  }
  set observing(observing) {
    this._observing = observing;
  }
  get position() {
    return this._position;
  }
  set position(position) {
    this._position = position;
  }
  createObject(scene) {
    this._object = scene.add.circle(
      this._position.x,
      this._position.y,
      10,
      this._color
    );
    scene.physics.add.existing(this._object);
    this._object.body.setCollideWorldBounds(true);
    this._object.body.setCircle(10, -10, -10).setOffset(0, 0);
    if (this.isMyplayer) {
      this.follow(scene.cameras.main);
    }
  }
  removeObject() {
    if (this._object) {
      this._object.destroy();
    }
    this._object = undefined;
  }
  follow(camera) {
    camera.startFollow(this._object);
  }
  collisionWith(other, callback) {
    this._object.scene.physics.add.overlap(
      this._object,
      other.object,
      callback
    );
  }
  move(direction) {
    this._object.setPosition(direction.x, direction.y)
    switch (direction.curDirr) {
      case 'up':
        this._object.body.setVelocity(0, -100);
        break;
      case 'down':
        this._object.body.setVelocity(0, 100);
        break;
      case 'left':
        this._object.body.setVelocity(-100, 0);
        break;
      case 'right':
        this._object.body.setVelocity(100, 0);
        break;
    }
  }
  hide() {
    this._object
      .setActive(false)
      .setVisible(false);
  }
  show() {
    this._object
      .setActive(true)
      .setVisible(true);
  }
  respawn() {
    this._object.setPosition(this._position.x, this._position.y);
    this.show();
  }
  stop() {
    this._object.body.setVelocity(0, 0);
  }
  observe(x, y) {
    this._object
      .setVisible(false)
      .setPosition(x, y);
  }
  get object() {
    return this._object;
  }
  get alive() {
    return this._status && this._status == 'alive';
  }
  get dead() {
    return !this._status || this._status == 'dead';
  }
  get status() {
    return this._status;
  }
  set status(status) {
    this._status = status;
  }
  format() {
    return {
      name: this._name,
      color: this._color,
      observing: this._observing,
      position: this._position,
      status: this._status,
    };
  }
}

export function createPlayer(data) {
  let player = new Player(data);
  return player;
}

export function recreatePlayers(coordinator) {
  coordinator.myplayer.then((myplayer) => {
    myplayer.removeObject();
    myplayer.createObject(coordinator._gameScene);

    if (coordinator.observer) {
      let x = coordinator._bounds.width / 2;
      let y = coordinator._bounds.height / 2;
      myplayer.observe(x, y);
    } else {
      coordinator.generateSpawnpoint();
    }

    for (let playerid in coordinator.players) {
      coordinator.getPlayer(playerid).then((player) => {
        if (player.isMyplayer) {
          return;
        }
        player.removeObject();
        player.createObject(coordinator._gameScene);
        if (player.observing || player.dead) {
          player.hide();
        } else {
          player.show();
          if (!myplayer.observing) {
            player.collisionWith(myplayer, () => {
              if (myplayer.alive && player.alive) {
                coordinator.fireEvent('change-status', 'dead');
              }
            });
          }
        }
      });
    }
  });
}
