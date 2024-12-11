class GameState {
  constructor() {
    this._players = {};
    this._food = {};
    this._currentFoodIndex = 0;
  }
  get players() {
    return this._players;
  }
  addPlayer(player) {
    console.log(player)
    if(!this._players[player.id])
      this._players[player.id] = player;
    return player;
  }
  removePlayer(playerId) {
    return new Promise((resolve, reject) => {
      this.getPlayer(playerId).then((player) => {
        player.removeObject();
        delete this._players[player.id];
        resolve();
      }).catch((e) => {
        reject('Player not found');
      });
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
  get food() {
    return this._food;
  }
  get nextFoodIndex() {
    return this._currentFoodIndex++;
  }
  addFood(food) {
    this._food[food.id] = food;
    return food;
  }
  removeFood(foodId) {
    return new Promise((resolve, reject) => {
      this.getFood(foodId).then((food) => {
        delete this._food[food.id];
        resolve();
      }).catch((e) => {
        reject(e);
      });
    });
  }
  getFood(id) {
    return new Promise((resolve, reject) => {
      let food = this._food[id];
      if (food) {
        resolve(food);
      } else {
        reject('Food not found');
      }
    });
  }
  format() {
    return {
      players: Object.values(this._players).map((player) => player.format()),
      food: Object.values(this._food).map((food) => food.format()),
    };
  }
}

export default GameState;
