import createWebRTCConnection from './webrtc';
import createWebSocketConnection from './websocket';

class ConnectionManager {
  constructor(server) {
    this.wsc = createWebSocketConnection(server);
    this.webrtcs = {};
    this._room = undefined;
  }
  joinRoom(room_code = '') {
    return new Promise((resolve, reject) => {
      this.wsc.em.once('room-entered', (response) => {
        if (response.room_code) {
          this._room = response.room_code;
          resolve(response);
        } else {
          reject(response);
        }
      });
      this.wsc.em.emit('room-enter', { room_code: room_code });
    });
  }
}

export default ConnectionManager;
