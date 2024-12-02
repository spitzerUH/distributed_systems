class Player {
  constructor() {
    this._id = undefined;
    this._name = undefined;
    this._color = undefined;
    this._observing = undefined;
    this._spawnpoint = { x: 0, y: 0 };
    this._status = undefined;
    this._object = undefined;
  }
}

export function createPlayer(data) {
  let player = new Player();
  return player;
}
