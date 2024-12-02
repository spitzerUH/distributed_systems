class GameState {
  constructor() {
    this._players = {};
  }
  addPlayer(player) {
    this._players[player.id] = player;
  }
  removePlayer(player) {
    return new Promise((resolve) => {
      if (player) {
        this._players[player.id].resetObject();
        delete this._players[player.id];
        resolve();
      } else {
        reject('Player not found');
      }
    });
  }
  getPlayer(id) {
    return new Promise((resolve, reject) => {
      let player = this._players[id];
      if (player) {
        resolve(player);
      } else {
        reject('Player not found');
      }
    });
  }
}
