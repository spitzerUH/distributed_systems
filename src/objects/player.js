class Player {
  constructor(data) {
    this._id = data.id;
    this._name = data.name;
    this._color = data.color;
    this._observing = data.observing;
    this._position = data.position;
    this._status = data.status;
    this._object = undefined;
  }
  createObject(scene) {
    this.object = scene.add.circle(
      this._position.x,
      this._position.y,
      10,
      this._color
    );
    scene.physics.add.existing(this.object);
  }
}

export function createPlayer(scene, data) {
  let player = new Player(data);
  player.createObject(scene);
  return player;
}
