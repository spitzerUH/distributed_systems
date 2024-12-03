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
    this._gameState = new GameState({ connection: this._connectionManager, observer: false });
    return this._connectionManager.joinRoom(roomCode);
  }

  observe(roomCode) {
    this._gameState = new GameState({ connection: this._connectionManager, observer: true });
    return this._connectionManager.joinRoom(roomCode);
  }
}

export default Coordinator;
