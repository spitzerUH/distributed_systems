import { EventEmitter } from 'events';
import { createPlayer } from '+objects/player';
import { createMessage, formatStatusChange, formatFoodCreate, formatFoodEat } from '+logic/game/message';

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
    this.handleStatusChange();
    this.handleFood();
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

  gameChannelMessage(playerid, message) {
    let msg = createMessage(playerid, message);
    msg.doAction(this, this);
  }

  handleStatusChange() {
    this.on('change-status', (status) => {
      this.players['player']._status = status;
      let message = formatStatusChange(this.players['player']);
      this._connection.sendGameMessage(message).then(() => {
        this.emit('status-change', 'player', status);
      });
    });
  }

  handleFood() {
    this.on('create-food', (data) => {
      this.foodToSend += data.length;
    });
    this.on('food-created', (food) => {
      food.forEach((f) => {
        if (f.id > this._currentFoodIndex) {
          this._currentFoodIndex = f.id;
        }
        this.food[f.id] = f;
      });
      if (this._connection.isLeader) {
        let message = formatFoodCreate(food);
        this._connection.sendGameMessage(message).then(() => {
        });
      }
    });
    this.on('food-eaten', (foodId) => {
      let message = formatFoodEat(foodId);
      this._connection.sendGameMessage(message).then(() => {
        this.emit('eat-food', foodId);
      });
    });
    this.on('eat-food', (foodId) => {
      let food = this.food[foodId];
      if (!food) {
        console.log('Dup message? Food not found', foodId);
        return;
      }
      food.eat().then((fId) => {
        delete this.food[fId];
      });
      if (this.connection.isLeader && Object.keys(this.food).length < 10) {
        this.emit('generate-food', 10);
      }
    });
    this.on('send-food', (playerid) => {
      let message = formatFoodCreate(this.food);
      this._connection.sendGameMessageTo(playerid, message).then(() => {
      });
    });
  }
}
