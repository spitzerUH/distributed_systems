import { createPlayer } from '+objects/player';

export class GameState {
  constructor(data = {}) {
    this._connection = data.connection;
    this._players = {};
    this._food = {};
    this._currentFoodIndex = 0;
    this.foodToSend = 0;
    this.foodToSendArray = [];
    this.players['player'] = createPlayer({
      id: 'player',
      name: JSON.parse(localStorage.getItem('player-name')),
      color: JSON.parse(localStorage.getItem('player-color')),
      observing: !!data.observer
    });
  }

  get connection() {
    return this._connection;
  }

  get players() {
    return this._players;
  }

  get food() {
    return this._food;
  }

  set food(food) {
    this._food = food;
  }

  get nextFoodIndex() {
    return this._currentFoodIndex++;
  }

}
