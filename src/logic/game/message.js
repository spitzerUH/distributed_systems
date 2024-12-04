import { createPlayer } from "+objects/player";

class Message {
  constructor(type) {
    this._type = type;
  }
  doAction(coordinator) {
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
  doAction(coordinator) {
    return new Promise((resolve, reject) => {
      coordinator.players[this._playerData.id] = createPlayer(this._playerData);
      coordinator.fireEvent('player-joins', this._playerData.id).then(() => {
        resolve();
      }).catch((error) => {
        reject('player-joins event failed');
      });
    });
  }

}

class Move extends Message {
  constructor(playerid, direction) {
    super('move');
    this._playerid = playerid;
    this._direction = direction;
  }
  doAction(coordinator) {
    return new Promise((resolve, reject) => {
      coordinator.fireEvent('player-moves', this._playerid, this._direction).then(() => {
        resolve();
      }).catch((error) => {
        reject('player-moves event failed');
      });
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
  doAction(coordinator) {
    return new Promise((resolve, reject) => {
      let player = coordinator.players[this._playerid];
      player._status = this._status;
      player._position = this._position;
      player._observing = this._observing;
      coordinator.fireEvent('status-change', this._playerid, this._status).then(() => {
        resolve();
      }).catch((error) => {
        reject('status-change event failed');
      });
    });
  }
}

class Food extends Message {
  constructor(message) {
    super('food');
    this._message = message;
  }
  doAction(coordinator) {
    return new Promise((resolve, reject) => {
      switch (this._message.subtype) {
        case 'create':
          let data = this._message.data.filter(f => coordinator._gameState.food[f.id] === undefined);
          coordinator.fireEvent('create-food', data).then(() => {
            resolve();
          }).catch((error) => {
            reject('create-food event failed');
          });
          break;
        case 'eat':
          coordinator.fireEvent('eat-food', this._message.id).then(() => {
            resolve();
          }).catch((error) => {
            reject('eat-food event failed');
          });
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
      throw new Error('Unknown message type ' + type);
  }
}

function formatWhoAmI(player) {
  return {
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
    type: 'move',
    data: {
      direction: direction
    }
  };
}

function formatStatusChange(player) {
  return {
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
    type: 'food',
    subtype: 'create',
    data: food.map(f => f.format())
  };
}

function formatFoodEat(foodId) {
  return {
    type: 'food',
    subtype: 'eat',
    id: foodId
  };
}

export { createMessage, formatWhoAmI, formatMove, formatStatusChange, formatFoodCreate, formatFoodEat };
