import { GameState } from '+logic/gamestate';
import { EventEmitter } from 'events';
import { createMessage, formatWhoAmI, formatMove, formatFoodCreate, formatFoodEat } from '+logic/game/message';

import { generateFood } from '+objects/food';

class Coordinator {
  constructor(cm) {
    this._connectionManager = cm;
    this._gameState = undefined;
    this._em = new EventEmitter();
    this._bounds = undefined;
    this._gameScene = undefined;
  }

  get gameState() {
    return this._gameState;
  }

  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this._gameState = new GameState({ connection: this._connectionManager, observer: false });
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
      this._gameState = new GameState({ connection: this._connectionManager, observer: true });
      this.connectRoom(roomCode, resolve, reject);
    });
  }
  connectRoom(roomCode, resolve, reject) {
    this.bindEvents();
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
  fireEvent(event, data) {
    return new Promise((resolve, reject) => {
      if (this._em.emit(event, data)) {
        resolve();
      } else {
        reject();
      }
    });
  }
  bindEvents() {
    this.bindGlobalEvents();
    this.bindGameEvents();
  }
  bindGlobalEvents() {
    this._connectionManager.events.on('open', (uuid) => {
      this.sendWhoAmI();
      this._gameState.gameChannelOpen(uuid);
    });
    this._connectionManager.events.on('message', (uuid, message) => {
      let msg = createMessage(uuid, message);
      msg.doAction(this._gameState, this._gameState);
    });
    this._connectionManager.events.on('close', (uuid) => {
      this._gameState.gameChannelClose(uuid);
    });
  }
  bindGameEvents() {
    this._gameState.on('player-joins', (playerid) => {
      let player = this._gameState.players[playerid];
      if (player) {
        player.createObject(this._gameScene);
        if (player._observing || !player._status || player._status == 'dead') {
          player.hide();
        }
        if (!this._gameState.players['player']._observing) {
          let myplayer = this._gameState.players['player'];
          player.collisionWith(myplayer, () => {
            if (this._gameState.players['player']._status == 'alive' && player._status == 'alive') {
              this._gameState.emit('change-status', 'dead');
            }
          });
        }
        if (!this._gameState.players['player']._observing && this._gameState.players['player']._status == 'alive') {
          this._gameState.emit('change-status', 'alive');
        }
      }
    });
    this._gameState.on('player-moves', (playerid, direction) => {
      let player = this._gameState.players[playerid];
      player.move(direction);
    });
    this._gameState.on('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          let deadPlayer = this._gameState.players[playerid];
          deadPlayer.stop();
          deadPlayer.hide();
          if (playerid == 'player') {
            this.generateSpawnpoint();
            this._gameScene.scene.run('GameOver', { coordinator: this });
          }
          break;
        case 'alive':
          if (this._gameState.players[playerid]) {
            this._gameState.players[playerid].respawn();
          }
          if (this._connectionManager.isLeader && playerid !== 'player') {
            this._gameState.emit('send-food', playerid);
          }
          break;
      }
    });
    this._gameState.on('generate-food', (count) => {
      let foodData = generateFood(this._gameScene, this._gameState, count);
      this._gameState.emit('create-food', foodData);
    });
    this._gameState.on('send-food', (playerid) => {
      let message = formatFoodCreate(this._gameState.food);
      this._connectionManager.sendGameMessageTo(playerid, message).then(() => {
      });
    });
    this._gameState.on('eat-food', (foodId) => {
      let food = this._gameState.food[foodId];
      if (!food) {
        console.log('Dup message? Food not found', foodId);
        return;
      }
      food.eat().then((fId) => {
        delete this._gameState.food[fId];
      });
      if (this._connectionManager.isLeader && Object.keys(this._gameState.food).length < 10) {
        this._gameState.emit('generate-food', 10);
      }
    });
    this._gameState.on('food-eaten', (foodId) => {
      let message = formatFoodEat(foodId);
      this._connectionManager.sendGameMessage(message).then(() => {
        this._gameState.emit('eat-food', foodId);
      });
    });
    this._gameState.on('food-created', (food) => {
      food.forEach((f) => {
        if (f.id > this._gameState._currentFoodIndex) {
          this._gameState._currentFoodIndex = f.id;
        }
        this._gameState.food[f.id] = f;
      });
      if (this._connectionManager.isLeader) {
        let message = formatFoodCreate(food);
        this._connectionManager.sendGameMessage(message).then(() => {
        });
      }
    });
  }
  movePlayer(direction) {
    let message = formatMove(direction);
    this._connectionManager.sendGameMessage(message).then(() => {
    });
  }
  sendWhoAmI() {
    let message = formatWhoAmI(this._gameState.players['player']);
    this._connectionManager.sendGameMessage(message).then(() => {
    });
  }
  generateSpawnpoint() {
    let randomPoint = this._bounds.getRandomPoint();
    let spawnpoint = { x: randomPoint.x, y: randomPoint.y };
    this._gameState.emit('spawnpoint', spawnpoint);
  }
}

export default Coordinator;
