class Player {
  constructor(data) {
    this._id = data.id;
    this._name = data.name;
    this._color = data.color || 0x000000;
    this._observing = data.observing;
    this._position = data.position || { x: 0, y: 0 };
    this._status = data.status;
    this._object = undefined;
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
  }
  resetObject() {
    if (this._object) {
      this._object.destroy();
    }
    this._object = undefined;
  }
  follow(camera) {
    camera.startFollow(this._object);
  }
  collisionWith(player, callback) {
    this._object.scene.physics.add.overlap(
      this._object,
      player.object,
      callback
    );
  }
  move(direction) {
    switch (direction) {
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
  get object() {
    return this._object;
  }
}

export function createPlayer(data) {
  let player = new Player(data);
  return player;
}
