import GameState from './state';
import { EventEmitter } from 'events';
import { createPlayer, recreatePlayers } from '+objects/player';
import {
  createMessage, formatWhoAmI, formatMove, formatFoodCreate, formatFoodEat, formatStatusChange
} from '+logic/game/message';

import { recreateFood, startFoodProcessing, generateFood } from '+objects/food';

class Coordinator {
  constructor(cm) {
    this._connectionManager = cm;
    this._gameState = undefined;
    this._em = new EventEmitter();
    this._bounds = undefined;
    this._gameScene = undefined;
    this._observer = false;

    this._previousDirection = undefined;
    this._timeWhenLastInput = undefined;
    this._lastInformed = undefined;
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
      player.observing = this._observer;
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

  get isGM() {
    return this._connectionManager.isLeader;
  }

  sendMessage(message) {
    return this._connectionManager.sendGameMessage(message);
  }

  sendMessageTo(id, message) {
    return this._connectionManager.sendGameMessageTo(id, message);
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
    this._connectionManager.events.on('game-message', (uuid, message) => {
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
        player.createObject(this._gameScene).then(() => {
          if (player.observing || player.dead) {
            player.hide();
          }
          if (!this.observer) {
            this.myplayer.then((myplayer) => {
              player.collisionWith(myplayer, () => {
                if (myplayer.alive && player.alive) {
                  this.fireEvent('change-status', 'dead');
                }
              });
              if (myplayer.alive) {
                this.fireEvent('change-status', 'alive');
              }
            });
          }
        }).catch((err) => {
          console.error(err);
        });
      });
    });
    this.bindEvent('player-moves', (playerid, data) => {
      this.getPlayer(playerid).then((player) => {
        player.position = data.position;
        player.move(data.direction);
      });
    });
    this.bindEvent('status-change', (playerid, status) => {
      switch (status) {
        case 'dead':
          this.getPlayer(playerid).then((deadPlayer) => {
            deadPlayer.stop();
            deadPlayer.hide();
            if (deadPlayer.isMyplayer) {
              this.generateSpawnpoint();
              this._gameScene.scene.run('GameOver', { coordinator: this });
            }
          });
          break;
        case 'alive':
          this.getPlayer(playerid).then((player) => {
            player.respawn();
            if (this.isGM && !player.isMyplayer) {
              this.fireEvent('send-food', playerid);
            }
          });
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
      this.sendMessageTo(playerid, message).then(() => {
      });
    });
    this.bindEvent('eat-food', (foodId) => {
      this.getFood(foodId).then((food) => {
        food.destroyObject().then((fId) => {
          this._gameState.removeFood(fId);
        });
        if (this.isGM && Object.keys(this.food).length < 10) {
          this.fireEvent('generate-food', 10);
        }
      }).catch((err) => {
        console.log('Dup message? Food not found', foodId);
      });
    });
    this.bindEvent('food-eaten', (foodId) => {
      let message = formatFoodEat(foodId);
      this.sendMessage(message).then(() => {
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
      if (this.isGM) {
        let message = formatFoodCreate(food);
        this.sendMessage(message).then(() => {
        });
      }
    });
    this.bindEvent('change-status', (status) => {
      this.myplayer.then((player) => {
        player.status = status;
        let message = formatStatusChange(player);
        this.sendMessage(message).then(() => {
          this.fireEvent('status-change', player.id, player.status);
        });
      });
    });
    this.bindEvent('leader-actions', () => {
      if (Object.keys(this.food).length === 0) {
        this.fireEvent('generate-food', 20);
      }
    });
  }
  bindRaftEvents() {
    this._connectionManager.events.on("leader-change", (data) => {
      this.fireEvent("leader-change", data);
      this.fireEvent('leader-actions');
    });
  }
  createMyPlayer() {
    let playerData = {
      id: this._connectionManager.id,
      name: JSON.parse(localStorage.getItem('player-name')),
      color: JSON.parse(localStorage.getItem('player-color')),
      observing: this.observer,
      myplayer: true
    };
    let player = createPlayer(playerData);
    this.addPlayer(player);
  }
  movePlayer(direction, position) {
    this.fireEvent('move', direction);
    let message = formatMove(direction, position);
    this.sendMessage(message).then(() => {
    });
  }
  sendWhoAmI() {
    this.myplayer.then((player) => {
      let message = formatWhoAmI(player);
      this.sendMessage(message).then(() => {
      });
    });
  }
  generateSpawnpoint() {
    let randomPoint = this._bounds.getRandomPoint();
    let spawnpoint = { x: randomPoint.x, y: randomPoint.y };
    this.myplayer.then((player) => {
      player.position = spawnpoint;
    });
  }

  gameChannelOpen(playerid) {
    if (this.isGM) {
      this.fireEvent('leader-actions');
    }
  }

  gameChannelClose(playerid) {
    this.fireEvent('player-leaves', playerid);
    this._gameState.removePlayer(playerid);
  }

  get myplayer() {
    return this.getPlayer(this._connectionManager.id);
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

  gameReady() {
    if (!this.myplayer.status) {
      this.generateSpawnpoint();
    }

    startFoodProcessing(this._gameScene, this);

    this.recreateObjects();


    this.fireEvent('player-joins', this._connectionManager.id);

    if (!this.observer) {
      this.fireEvent('change-status', 'alive');
    }
  }

  handleInput(time, delta, cursors) {
    var curDirr = undefined;
    if (time - this._timeWhenLastInput < 100) { // 100ms
      return;
    }
    if (cursors.left.isDown) {
      curDirr = "left";
    } else if (cursors.right.isDown) {
      curDirr = "right";
    } else if (cursors.up.isDown) {
      curDirr = "up";
    } else if (cursors.down.isDown) {
      curDirr = "down";
    }
    this.myplayer.then((myplayer) => {
      myplayer.move(curDirr);
      if (this.observer)
        return;
      if (curDirr && curDirr != this._previousDirection) {
        this.movePlayer(curDirr, myplayer.position);
        this._previousDirection = curDirr;
        this._timeWhenLastInput = time;
      } else if (!this._lastInformed || time - this._lastInformed > 100) {
        this.movePlayer(this._previousDirection, myplayer.position);
        this._lastInformed = time;
      }
    });
  }

  recreateObjects() {
    recreatePlayers(this);
    recreateFood(this._gameScene, this);
  }

  killPlayer() {
    this.fireEvent('change-status', 'dead');
  }
  spawnPlayer() {
    this.fireEvent('change-status', 'alive');
  }

}

export default Coordinator;
