import GameState from './state';
import { EventEmitter } from 'events';
import { createPlayer } from '+objects/player';
import {
  createMessage, formatWhoAmI, formatMove, formatFoodCreate, formatFoodEat, formatStatusChange
} from '+logic/game/message';

import { generateFood } from '+objects/food';

class Coordinator {
  constructor(cm) {
    this._connectionManager = cm;
    this._gameState = undefined;
    this._em = new EventEmitter();
    this._bounds = undefined;
    this._gameScene = undefined;
    this._observer = false;
  }

  get room() {
    return this._connectionManager.room;
  }

  get observer() {
    return this._observer;
  }

  set observer(value) {
    this._observer = !!value;
    this.myplayer.then((player) => {
      player._observing = this._observer;
    });
  }

  get gameState() {
    return this._gameState;
  }

  get players() {
    return this._gameState.players;
  }

  get food() {
    return this._gameState.food;
  }

  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this._observer = false;
      this._gameState = new GameState();
      this.connectRoom(roomCode, resolve, reject);
    });
  }
  leaveRoom() {
    return new Promise((resolve, reject) => {
      this._connectionManager.exitRoom().then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }
  observe(roomCode) {
    return new Promise((resolve, reject) => {
      this._observer = true;
      this._gameState = new GameState();
      this.connectRoom(roomCode, resolve, reject);
    });
  }
  connectRoom(roomCode, resolve, reject) {
    this.bindEvents();
    this.createMyPlayer();
    this._connectionManager.joinRoom(roomCode).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  }
  setBounds(bounds) {
    this._bounds = bounds;
  }
  setGameScene(scene) {
    this._gameScene = scene;
  }
  bindEvent(event, handler) {
    this._em.on(event, handler);
  }
  fireEvent(event, ...data) {
    return new Promise((resolve, reject) => {
      if (this._em.emit(event, ...data)) {
        resolve();
      } else {
        reject();
      }
    });
  }
  bindEvents() {
    this.bindGlobalEvents();
    this.bindGameEvents();
    this.bindRaftEvents();
  }
  bindGlobalEvents() {
    this._connectionManager.events.on('open', (uuid) => {
      this.sendWhoAmI();
      this.gameChannelOpen(uuid);
    });
    this._connectionManager.events.on('message', (uuid, message) => {
      let msg = createMessage(uuid, message);
      msg.doAction(this);
    });
    this._connectionManager.events.on('close', (uuid) => {
      this.gameChannelClose(uuid);
    });
  }
  bindGameEvents() {
    this.bindEvent('player-joins', (playerid) => {
      this.getPlayer(playerid).then((player) => {
        player.createObject(this._gameScene);
        if (player._observing || !player._status || player._status == 'dead') {
          player.hide();
        }
        if (!this.observer) {
          this.myplayer.then((myplayer) => {
            player.collisionWith(myplayer, () => {
              if (myplayer._status == 'alive' && player._status == 'alive') {
                this.fireEvent('change-status', 'dead');
              }
            });
            if (myplayer._status == 'alive') {
              this.fireEvent('change-status', 'alive');
            }
          });
        }
      });
    });
    this.bindEvent('player-moves', (playerid, direction) => {
      this.getPlayer(playerid).then((player) => {
        player.move(direction);
      });
    });
    this.bindEvent('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          this.getPlayer(playerid).then((deadPlayer) => {
            deadPlayer.stop();
            deadPlayer.hide();
            if (playerid == 'player') {
              this.generateSpawnpoint();
              this._gameScene.scene.run('GameOver', { coordinator: this });
            }
          });
          break;
        case 'alive':
          this.getPlayer(playerid).then((player) => {
            player.respawn();
          });
          if (this._connectionManager.isLeader && playerid !== 'player') {
            this.fireEvent('send-food', playerid);
          }
          break;
      }
    });
    this.bindEvent('create-food', (data) => {
    });
    this.bindEvent('generate-food', (count) => {
      let foodData = generateFood(this._gameScene, this, count);
      this.fireEvent('create-food', foodData);
    });
    this.bindEvent('send-food', (playerid) => {
      let message = formatFoodCreate(this.food);
      this._connectionManager.sendGameMessageTo(playerid, message).then(() => {
      });
    });
    this.bindEvent('eat-food', (foodId) => {
      let food = this.food[foodId];
      this.getFood(foodId).then((food) => {
        food.eat().then((fId) => {
          this._gameState.removeFood(fId);
        });
        if (this._connectionManager.isLeader && Object.keys(this.food).length < 10) {
          this.fireEvent('generate-food', 10);
        }
      }).catch((err) => {
        console.log('Dup message? Food not found', foodId);
      });
    });
    this.bindEvent('food-eaten', (foodId) => {
      let message = formatFoodEat(foodId);
      this._connectionManager.sendGameMessage(message).then(() => {
        this.fireEvent('eat-food', foodId);
      });
    });
    this.bindEvent('food-created', (food) => {
      food.forEach((f) => {
        if (f.id > this._gameState._currentFoodIndex) {
          this._gameState._currentFoodIndex = f.id;
        }
        this.food[f.id] = f;
      });
      if (this._connectionManager.isLeader) {
        let message = formatFoodCreate(food);
        this._connectionManager.sendGameMessage(message).then(() => {
        });
      }
    });
    this.bindEvent('change-status', (status) => {
      this.myplayer.then((player) => {
        player._status = status;
        let message = formatStatusChange(player);
        this._connectionManager.sendGameMessage(message).then(() => {
          this.fireEvent('status-change', 'player', status);
        });
      });
    });
    this.bindEvent('ready', () => {
      if (!this.observer) {
        this.fireEvent('change-status', 'alive');
      }
    });

    this.bindEvent('spawnpoint', (point) => {
      this.myplayer.then((player) => {
        player._position = point;
      });
    });
    this.bindEvent('leader-actions', () => {
      if (Object.keys(this.food).length === 0) {
        this.fireEvent('generate-food', 20);
      }
    });
  }
  bindRaftEvents() {
    this.connection.events.on("leader-change", (data) => {
      this.emit("leader-change", data);
      this.emit('leader-actions');
    });
  }
  createMyPlayer() {
    let playerData = {
      id: 'player',
      name: JSON.parse(localStorage.getItem('player-name')),
      color: JSON.parse(localStorage.getItem('player-color')),
      observing: this.observer
    };
    let player = createPlayer(playerData);
    this._gameState.addPlayer(player);
  }
  movePlayer(direction) {
    this.fireEvent('move', direction);
    let message = formatMove(direction);
    this._connectionManager.sendGameMessage(message).then(() => {
    });
  }
  sendWhoAmI() {
    this.myplayer.then((player) => {
      let message = formatWhoAmI(player);
      this._connectionManager.sendGameMessage(message).then(() => {
      });
    });
  }
  generateSpawnpoint() {
    let randomPoint = this._bounds.getRandomPoint();
    let spawnpoint = { x: randomPoint.x, y: randomPoint.y };
    this.fireEvent('spawnpoint', spawnpoint);
  }

  gameChannelOpen(playerid) {
    if (this._connectionManager.isLeader) {
      this.fireEvent('leader-actions');
    }
  }

  gameChannelClose(playerid) {
    this.fireEvent('player-leaves', playerid);
    this._gameState.removePlayer(playerid);
  }

  get myplayer() {
    return this.getPlayer('player');
  }
  getPlayer(playerid) {
    return this._gameState.getPlayer(playerid);
  }
  addPlayer(player) {
    return this._gameState.addPlayer(player);
  }
  getFood(foodid) {
    return this._gameState.getFood(foodid);
  }

}

export default Coordinator;
