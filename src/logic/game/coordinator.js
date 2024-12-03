import { GameState } from '+logic/gamestate';
import { EventEmitter } from 'events';
import { formatWhoAmI, formatMove } from '+logic/game/message';

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
      this._gameState.gameChannelMessage(uuid, message);
    });
    this._connectionManager.events.on('close', (uuid) => {
      this._gameState.gameChannelClose(uuid);
    });
  }
  bindGameEvents() {
    this._gameState.on('player-moves', (playerid, direction) => {
      let player = this._gameState.players[playerid];
      player.move(direction);
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
