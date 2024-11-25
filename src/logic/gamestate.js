import { EventEmitter } from 'events';

export class GameState extends EventEmitter {
  constructor(data = {}) {
    super();
    this._connection = data.connection;
    this._observer = !!data.observer;
  }

  get observer() {
    return this._observer;
  }

  get connection() {
    return this._connection;
  }
}
