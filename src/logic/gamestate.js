import { EventEmitter } from 'events';
import { createPlayer } from '+objects/player';

export class GameState extends EventEmitter {
  constructor(data = {}) {
    super();
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
    this.on('spawnpoint', (point) => {
      this.players['player']._position = point;
    });
    this.on('ready', () => {
      if (!this.players['player']._observing) {
        this.emit('change-status', 'alive');
      }
    });
    this.on('leader-actions', () => {
      if (Object.keys(this.food).length === 0) {
        this.emit('generate-food', 20);
      }
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

  gameChannelOpen(playerid) {
    if (this.connection.isLeader) {
      this.emit('leader-actions');
    }
  }

  gameChannelClose(playerid) {
    this.emit('player-leaves', playerid);
    if (this.players[playerid]) {
      this.players[playerid].resetObject();
      delete this._players[playerid];
    }
  }

}
