import { EventEmitter } from 'events';

export class GameState extends EventEmitter {
  constructor(data = {}) {
    super();
    this._connection = data.connection;
    this._observer = !!data.observer;
    this._players = {};
    this.connection.gameChannelOpen = this.gameChannelOpen.bind(this);
    this.connection.gameChannelMessage = this.gameChannelMessage.bind(this);
    this.connection.gameChannelClose = this.gameChannelClose.bind(this);
    this.sendMovement();
  }

  get observer() {
    return this._observer;
  }

  get connection() {
    return this._connection;
  }

  gameChannelOpen(playerid) {
    this.emit('gameChannelOpen', playerid);
  }

  gameChannelClose(playerid) {
    this.emit('player-leaves', playerid);
    delete this._players[playerid];
  }

  gameChannelMessage(playerid, message) {
    let player = this._players[playerid];
    if (!player) {
      let playername = playerid;
      this._players[playerid] = playername;
      this.emit('player-joins', playerid, playername);
    }
    switch (message.type) {
      case 'move':
        this.emit('player-moves', playerid, message.data.direction);
        break;
    }
  }

  sendMovement() {
    this.on('move', (direction) => {
      this._connection.sendGameMessage({ type: 'move', data: { direction: direction } }).then(() => {
      });
    });
  }
}
