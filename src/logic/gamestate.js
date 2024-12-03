import { EventEmitter } from 'events';
import { createPlayer } from '+objects/player';
import { createMessage } from '+logic/game/message';

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
    this.connection.events.on('open', (uuid) => {
      this.gameChannelOpen(uuid);
    });
    this.connection.events.on('message', (uuid, message) => {
      this.gameChannelMessage(uuid, message);
    });
    this.connection.events.on('close', (uuid) => {
      this.gameChannelClose(uuid);
    });
    this.handleMovement();
    this.handleStatusChange();
    this.bindWhoEvents();
    this.handleFood();
    this.on('spawnpoint', (point) => {
      this.players['player']._position = point;
    });
    this.on('leave', () => {
      this.connection.exitRoom();
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
    this.emit('whoami');
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

  bindWhoEvents() {
    this.on('whoami', () => {
      let payload = {
        type: 'whoami',
        data: {
          name: this.players['player']._name,
          color: this.players['player']._color,
          observing: this.players['player']._observing,
          status: this.players['player']._status,
          position: this.players['player']._position
        }
      };
      this._connection.sendGameMessage(payload).then(() => {
      });
    });
  }

  handleMovement() {
    this.on('move', (direction) => {
      this._connection.sendGameMessage({ type: 'move', data: { direction: direction } }).then(() => {
      });
    });
  }

  handleStatusChange() {
    this.on('change-status', (status) => {
      let data = undefined;
      if (status === 'dead') {
        data = { status: status };
      } else {
        data = { status: status, position: this.players['player']._position };
      }
      this.players['player']._status = status;
      this._connection.sendGameMessage({ type: 'status', data: data }).then(() => {
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
        let data = food.map(f => f.format());
        this._connection.sendGameMessage({ type: 'food', subtype: 'create', data: data }).then(() => {
        });
      }
    });
    this.on('food-eaten', (foodId) => {
      this._connection.sendGameMessage({ type: 'food', subtype: 'eat', id: foodId }).then(() => {
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
      let data = Object.values(this.food).map(f => {
        return f.format();
      });
      this._connection.sendGameMessageTo(playerid, { type: 'food', subtype: 'create', data: data }).then(() => {
      });
    });
  }
}
