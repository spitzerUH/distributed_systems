import io from 'socket.io-client';
import EventEmitter from 'events';

class WebSocketConnection {
  constructor(server) {
    this.socket = io(server, {
      autoConnect: false
    });
    this.em = new EventEmitter();
  }

  bindIncomingEvents() {
    this.socket.on('connect', () => {
      this.em.emit('connect');
    });

    this.socket.on('disconnect', () => {
      this.em.emit('disconnect');
    });

    this.socket.on('message', (data) => {
      this.em.emit('message', data);
    });

    this.socket.on('room-joined', (data) => {
      this.em.emit('room-joined', data);
    });
    this.socket.on('room-left', (data) => {
      this.em.emit('room-left', data);
    });

    this.socket.on('webrtc-offer', (data) => {
      this.em.emit('webrtc-offer', data);
    });
    this.socket.on('webrtc-answer', (data) => {
      this.em.emit('webrtc-answer', data);
    });
    this.socket.on('webrtc-candidate', (data) => {
      this.em.emit('webrtc-candidate', data);
    });

  }

  bindOutgoingEvents() {
    this.em.on('room-enter', (data) => {
      this.socket.emit('room-enter', data, (response) => {
        this.em.emit('room-entered', response);
      });
    });
    this.em.on('room-exit', (data) => {
      this.socket.emit('room-leave', data, (response) => {
        this.em.emit('room-exited', response);
      });
    });
    this.em.on('webrtc-offer', (data) => {
      this.socket.emit('webrtc-offer', data);
    });
    this.em.on('webrtc-answer', (data) => {
      this.socket.emit('webrtc-answer', data);
    });
    this.em.on('webrtc-candidate', (data) => {
      this.socket.emit('webrtc-candidate', data);
    });
  }

  connect() {
    return this.socket.connect();
  }

}

function createWebSocketConnection(server) {
  let wsc = new WebSocketConnection(server);
  wsc.bindIncomingEvents();
  wsc.bindOutgoingEvents();
  return wsc;
}

export default createWebSocketConnection;
