import { GameState } from '+logic/gamestate';
import { EventEmitter } from 'events';

class Coordinator {
  constructor(cm) {
    this._connectionManager = cm;
    this._gameState = undefined;
    this._em = new EventEmitter();
  }

  get gameState() {
    return this._gameState;
  }

  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this._gameState = new GameState({ connection: this._connectionManager, observer: false });
      this.bindGlobalEvents();
      this.connectRoom(roomCode, resolve, reject);
    });
  }

  observe(roomCode) {
    return new Promise((resolve, reject) => {
      this._gameState = new GameState({ connection: this._connectionManager, observer: true });
      this.bindGlobalEvents();
      this.connectRoom(roomCode, resolve, reject);
    });
  }
  connectRoom(roomCode, resolve, reject) {
    this._connectionManager.joinRoom(roomCode).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
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
}

export default Coordinator;
