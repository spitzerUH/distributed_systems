import { GameState } from '+logic/gamestate';

class Coordinator {
  constructor(cm) {
    this._connectionManager = cm;
    this._gameState = undefined;
  }

  get gameState() {
    return this._gameState;
  }

  joinRoom(roomCode) {
    return new Promise((resolve, reject) => {
      this._gameState = new GameState({ connection: this._connectionManager, observer: false });
      this._connectionManager.joinRoom(roomCode).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }

  observe(roomCode) {
    return new Promise((resolve, reject) => {
      this._gameState = new GameState({ connection: this._connectionManager, observer: true });
      this._connectionManager.joinRoom(roomCode).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

export default Coordinator;
