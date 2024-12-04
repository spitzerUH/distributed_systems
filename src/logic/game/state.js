class GameState {
  constructor() {
    this._players = {};
    this._food = {};
  }
  addPlayer(player) {
    this._players[player.id] = player;
  }
  removePlayer(player) {
    return new Promise((resolve) => {
      if (player) {
        this._players[player.id].removeObject();
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
  addFood(food) {
    this._food[food.id] = food;
  }
  removeFood(food) {
    return new Promise((resolve) => {
      if (food) {
        delete this._food[food.id];
        resolve();
      } else {
        reject('Food not found');
      }
    });
  }
}
