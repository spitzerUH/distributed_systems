import { createPlayer } from "+objects/player";

class Message {
  constructor(type) {
    this._type = type;
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      reject('doAction not implemented');
    });
  }
}

class WhoAmI extends Message {
  constructor(playerid, data) {
    super('whoami');
    this._playerData = {
      id: playerid,
      name: data.name,
      color: data.color,
      observing: data.observing,
      position: data.position,
      status: data.status
    };
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      state._players[this._playerData.id] = createPlayer(this._playerData);
      if (emitter.emit('player-joins', this._playerData.id)) {
        resolve();
      } else {
        reject('player-joins event failed');
      }
    });
  }

}

class Move extends Message {
  constructor(playerid, direction) {
    super('move');
    this._playerid = playerid;
    this._direction = direction;
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      if (emitter.emit('player-moves', this._playerid, this._direction)) {
        resolve();
      } else {
        reject('player-moves event failed');
      }
    });
  }
}

class StatusChange extends Message {
  constructor(playerid, data) {
    super('status');
    this._playerid = playerid;
    this._status = data.status;
    this._position = data.position;
    this._observing = data.observing || false;
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      let player = state.players[this._playerid];
      player._status = this._status;
      player._position = this._position;
      player._observing = this._observing;
      if (emitter.emit('status-change', this._playerid, this._status)) {
        resolve();
      } else {
        reject('status-change event failed');
      }
    });
  }
}

class Food extends Message {
  constructor(message) {
    super('food');
    this._message = message;
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      switch (this._message.subtype) {
        case 'create':
          let data = this._message.data.filter(f => state.food[f.id] === undefined);
          emitter.emit('create-food', data);
          resolve();
          break;
        case 'eat':
          emitter.emit('eat-food', this._message.id);
          resolve();
          break;
        default:
          reject('Unknown food message type ' + this._message.type);
      }
    });
  }
}

function createMessage(playerid, message) {
  switch (message.type) {
    case 'whoami':
      return new WhoAmI(playerid, message.data);
    case 'move':
      return new Move(playerid, message.data.direction);
    case 'status':
      return new StatusChange(playerid, message.data);
    case 'food':
      return new Food(message);
    default:      
      throw new Error('Unknown message type ' + message.type);
  }
}

function formatWhoAmI(player) {
  return {
    platform: 'game',
    type: 'whoami',
    data: {
      name: player._name,
      color: player._color,
      observing: player._observing,
      position: player._position,
      status: player._status
    }
  };
}

function formatMove(direction) {
  return {
    platform: 'game',
    type: 'move',
    data: {
      direction: direction
    }
  };
}

function formatStatusChange(player) {
  return {
    platform: 'game',
    type: 'status',
    data: {
      status: player._status,
      position: player._position,
      observing: player._observing
    }
  };
}

function formatFoodCreate(food) {
  if (!Array.isArray(food)) {
    food = Object.values(food)
  }
  return {
    platform: 'game',
    type: 'food',
    subtype: 'create',
    data: food.map(f => f.format())
  };
}

function formatFoodEat(foodId) {
  return {
    platform: 'game',
    type: 'food',
    subtype: 'eat',
    id: foodId
  };
}


export { createMessage, formatWhoAmI, formatMove, formatStatusChange, 
  formatFoodCreate, formatFoodEat };
