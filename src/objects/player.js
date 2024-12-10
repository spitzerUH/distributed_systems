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
  get id() {
    return this._id;
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
