import createWebRTCConnection from './webrtc';
import createWebSocketConnection from './websocket';
import { VectorClock } from './vc';

class ConnectionManager {
  constructor(server) {
    this.wsc = createWebSocketConnection(server);
    this.webrtcs = {};
    this.id = self.crypto.randomUUID();
    this._room = undefined;
    this.vc = undefined;
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
          this.vc = new VectorClock();
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
          this.vc = undefined;
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
      let webrtc = createWebRTCConnection(this.id, this.vc);
      this.bindWebRTCEvents(webrtc, sid);
      webrtc.em.emit('start-connection');
      this.webrtcs[uuid] = webrtc;
    });
    this.wsc.em.on('new-webrtc-offer', (data) => {
      let sid = data.sid;
      let uuid = data.uuid;
      let sdp = data.sdp;
      let webrtc = createWebRTCConnection(this.id, this.vc);
      this.bindWebRTCEvents(webrtc, sid, uuid);
      webrtc.em.emit('got-webrtc-offer', sdp);
      this.webrtcs[uuid] = webrtc;
    });
    this.wsc.em.on('new-webrtc-answer', (data) => {
      this.webrtcs[data.uuid].em.emit('got-webrtc-answer', data.sdp);
    });
    this.wsc.em.on('new-webrtc-candidate', (data) => {
      this.webrtcs[data.uuid].em.emit('got-webrtc-candidate', data.candidate);
    });
  }

  bindWebRTCEvents(webrtc, sid, uuid) {
    webrtc.em.on('send-webrtc-offer', (sdp) => {
      let data = {
        sid: sid,
        uuid: this.id,
        sdp: sdp
      };
      this.wsc.em.emit('send-webrtc-offer', data);
    });
    webrtc.em.on('send-webrtc-answer', (sdp) => {
      let data = {
        sid: sid,
        uuid: this.id,
        sdp: sdp
      };
      this.wsc.em.emit('send-webrtc-answer', data);
    });
    webrtc.em.on('send-webrtc-candidate', (candidate) => {
      let data = {
        sid: sid,
        uuid: this.id,
        candidate: candidate
      };
      this.wsc.em.emit('send-webrtc-candidate', data);
    });
    webrtc.em.on('receive-data-channel-message', (message) => {
      this.receiveMessage(uuid, message);
    });
  }

  receiveMessage(uuid, message) {
    console.log('Received message from', uuid, message);
  }

  sendMessage(uuid, message) {
    if (this.webrtcs[uuid]) {
      this.webrtcs[uuid].em.emit('send-data-channel-message', message);
    }
  }

}

export default ConnectionManager;
