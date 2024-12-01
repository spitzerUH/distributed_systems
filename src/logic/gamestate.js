import { EventEmitter } from 'events';

export class GameState extends EventEmitter {
  constructor(data = {}) {
    super();
    this._connection = data.connection;
    this._players = {};
    this._food = {};
    this._currentFoodIndex = 0;
    this.foodToSend = 0;
    this.foodToSendArray = [];
    this.players['player'] = {
      id: 'player',
      name: (JSON.parse(localStorage.getItem('player-name'))),
      color: (JSON.parse(localStorage.getItem('player-color')) || 0x000000),
      observing: !!data.observer,
      spawnpoint: { x: 0, y: 0 },
      status: undefined,
      object: undefined
    };
    this.connection.gameChannelOpen = this.gameChannelOpen.bind(this);
    this.connection.gameChannelMessage = this.gameChannelMessage.bind(this);
    this.connection.gameChannelClose = this.gameChannelClose.bind(this);
    this.handleMovement();
    this.handleStatusChange();
    this.bindWhoEvents();
    this.handleFood();
    this.on('spawnpoint', (point) => {
      this.players['player'].spawnpoint = point;
    });
    this.on('leave', () => {
      this.connection.exitRoom();
    });
    this.on('ready', () => {
      if (!this.players['player'].observing) {
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
    delete this._players[playerid];
  }

  gameChannelMessage(playerid, message) {
    switch (message.type) {
      case 'whoami':
        this.handlePlayerInfo(playerid, message.data);
        if (this.connection.isLeader) {
          this.emit('send-food', playerid);
        }
        break;
      case 'move':
        this.emit('player-moves', playerid, message.data.direction);
        break;
      case 'status':
        this.players[playerid].status = message.data.status;
        this.players[playerid].spawnpoint = message.data.spawnpoint;
        this.players[playerid].observing = false;
        this.emit('status-change', playerid, message.data.status);
        break;
      case 'food':
        switch (message.subtype) {
          case 'create':
            let data = message.data.filter(f => this.food[f.id] === undefined);
            this.emit('create-food', data);
            break;
          case 'eat':
            this.emit('eat-food', message.id);
            break;
          default:
            console.log('Unknown food message subtype', message.subtype);
            break;
        }
        break;
      default:
        console.log('Unknown message type', message.type);
        break;
    }
  }

  bindWhoEvents() {
    this.on('whoami', () => {
      let payload = {
        type: 'whoami',
        data: {
          name: this.players['player'].name,
          color: this.players['player'].color,
          observing: this.players['player'].observing,
          status: this.players['player'].status,
          spawnpoint: this.players['player'].spawnpoint
        }
      };
      this._connection.sendGameMessage(payload).then(() => {
      });
    });
  }

  handlePlayerInfo(playerid, data) {
    let playerData = {
      id: playerid,
      name: data.name,
      color: data.color,
      observing: data.observing,
      spawnpoint: data.spawnpoint,
      status: data.status,
      object: undefined
    };
    this._players[playerid] = playerData;
    this.emit('player-joins', playerid);
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
        data = { status: status, spawnpoint: this.players['player'].spawnpoint };
      }
      this.players['player'].status = status;
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
      if (food.id > this._currentFoodIndex) {
        this._currentFoodIndex = food.id;
      }
      this.food[food.id] = food;
      if (this._connection.isLeader) {
        this.foodToSendArray.push(food);
        this.foodToSend--;
        if (this.foodToSend === 0) {
          this._connection.sendGameMessage({ type: 'food', subtype: 'create', data: this.foodToSendArray }).then(() => {
            this.foodToSendArray = [];
          });
        }
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
      food.object.destroy();
      delete this.food[foodId];
      if (this.connection.isLeader && Object.keys(this.food).length < 10) {
        this.emit('generate-food', 10);
      }
    });
    this.on('send-food', (playerid) => {
      let food = Object.values(this.food).map(f => {
        return {
          id: f.id,
          details: f.details
        };
      });
      this._connection.sendGameMessageTo(playerid, { type: 'food', subtype: 'create', data: food }).then(() => {
      });
    });
  }
}
