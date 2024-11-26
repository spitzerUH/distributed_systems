import { EventEmitter } from 'events';

export class GameState extends EventEmitter {
  constructor(data = {}) {
    super();
    this._connection = data.connection;
    this._observer = !!data.observer;
    this._players = {};
    this._restarted = false;
    this.connection.gameChannelOpen = this.gameChannelOpen.bind(this);
    this.connection.gameChannelMessage = this.gameChannelMessage.bind(this);
    this.connection.gameChannelClose = this.gameChannelClose.bind(this);
    this.handleMovement();
    this.handleStatusChange();
    this.bindWhoEvents();
    this.on('leave', () => {
      this.connection.exitRoom();
    });
    this.on('restart', () => {
      this._restarted = true;
    });
  }

  get observer() {
    return this._observer;
  }

  get connection() {
    return this._connection;
  }

  get playerName() {
    return JSON.parse(localStorage.getItem('player-name')) || 'You';
  }

  get playerColor() {
    return JSON.parse(localStorage.getItem('player-color')) || 0x000000;
  }

  get restarted() {
    if (this._restarted) {
      this._restarted = false;
      return true;
    }
    return false;
  }

  get players() {
    return this._players;
  }

  stopObserving() {
    this._observer = false;
    this.emit('restart');
  }

  gameChannelOpen(playerid) {
    this.emit('gameChannelOpen', playerid);
  }

  gameChannelClose(playerid) {
    this.emit('player-leaves', playerid);
    delete this._players[playerid];
  }

  gameChannelMessage(playerid, message) {
    switch (message.type) {
      case 'whoami':
        this.handlePlayerInfo(playerid, message.data);
        break;
      case 'move':
        this.emit('player-moves', playerid, message.data.direction);
        break;
      case 'status':
        this.emit('status-change', playerid, message.data.status);
        break;
      default:
        console.log('Unknown message type', message.type);
        break;
    }
  }

  bindWhoEvents() {
    this.on('whoami', () => {
      let payload = {
        type: 'whoami',
        data: {
          name: this.playerName,
          color: this.playerColor,
          observing: this.observer
        }
      };
      this._connection.sendGameMessage(payload).then(() => {
      });
    });
  }

  handlePlayerInfo(playerid, data) {
    let playerData = {
      id: playerid,
      name: data.name,
      color: data.color,
      observing: data.observing
    };
    this._players[playerid] = playerData;
    this.emit('player-joins', playerid);
  }

  handleMovement() {
    this.on('move', (direction) => {
      this._connection.sendGameMessage({ type: 'move', data: { direction: direction } }).then(() => {
      });
    });
  }

  handleStatusChange() {
    this.on('change-status', (status) => {
      this._connection.sendGameMessage({ type: 'status', data: { status: status } }).then(() => {
        this.emit('status-change', 'player', status);
      });
    });
  }
}
