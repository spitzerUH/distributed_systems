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
      let player = coordinator.addPlayer(createPlayer(this._playerData));
      coordinator.fireEvent('player-joins', player.id).then(() => {
        resolve();
      }).catch((error) => {
        reject('player-joins event failed');
      });
    });
  }

}

class Move extends Message {
  constructor(playerid, data) {
    super('move');
    this._playerid = playerid;
    this._data = data;
  }
  doAction(coordinator) {
    return new Promise((resolve, reject) => {
      coordinator.fireEvent('player-moves', this._playerid, this._data).then(() => {
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
      coordinator.getPlayer(this._playerid).then((player) => {
        player.status = this._status;
        player.position = this._position;
        player.observing = this._observing;
        coordinator.fireEvent('status-change', this._playerid, this._status).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        reject(error);
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
          let data = this._message.data.filter(f => coordinator.food[f.id] === undefined);
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
      return new Move(playerid, message.data);
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
    type: 'whoami',
    data: player.format()
  };
}

function formatMove(direction, position) {
  return {
    type: 'move',
    data: {
      direction: direction,
      position: position
    }
  };
}

function formatStatusChange(player) {
  return {
    type: 'status',
    data: {
      status: player.status,
      position: player.position,
      observing: player.observing
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


export {
  createMessage, formatWhoAmI, formatMove, formatStatusChange,
  formatFoodCreate, formatFoodEat
};
