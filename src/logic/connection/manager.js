import createWebRTCConnection from './webrtc';
import createWebSocketConnection from './websocket';

class ConnectionManager {
  constructor(server) {
    this.wsc = createWebSocketConnection(server);
    this.webrtcs = {};
    this.id = self.crypto.randomUUID();
    this._room = undefined;
  }
  connect() {
    return new Promise((resolve, reject) => {
      if (this.wsc.socket.connected) {
        return reject('Already connected to server');
      }
      this.wsc.em.once('connected', () => {
        resolve();
      });
      this.wsc.em.once('connect-error', (error) => {
        reject(error);
      });
      this.wsc.socket.connect();
    });
  }
  joinRoom(room_code = '') {
    return new Promise((resolve, reject) => {
      if (!this.wsc.socket.connected) {
        return reject('Not connected to server');
      }
      if (this._room) {
        return reject('Already in a room');
      }
      this.wsc.em.once('room-entered', (response) => {
        if (response.room_code) {
          this._room = response.room_code;
          resolve(response);
        } else {
          reject(response);
        }
      });
      this.wsc.em.emit('room-enter', { uuid: this.id, room_code: room_code });
    });
  }
  exitRoom() {
    return new Promise((resolve, reject) => {
      if (!this.wsc.socket.connected) {
        reject('Not connected to server');
      }
      if (!this._room) {
        reject('Not in a room');
      }
      this.wsc.em.once('room-exited', (response) => {
        if (response.room_code && response.room_code === this._room) {
          this._room = undefined;
          resolve(response);
        } else {
          reject(response);
        }
      });
      this.wsc.em.emit('room-exit', { room_code: this._room });
    });
  }
  bindRoomEvents() {
    this.wsc.em.on('room-joined', (data) => {
      let sid = data.sid;
      let uuid = data.uuid;
      let webrtc = createWebRTCConnection();
      webrtc.em.on('send-webrtc-offer', (sdp) => {
        let data = {
          sid: sid,
          uuid: this.id,
          sdp: sdp
        };
        this.wsc.em.emit('webrtc-offer', data);
      });
      webrtc.em.emit('start-connection');
      this.webrtcs[uuid] = webrtc;
    });
  }
}

export default ConnectionManager;
