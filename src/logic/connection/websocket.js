import io from 'socket.io-client';
import EventEmitter from 'events';

class VectorClock {
  constructor() {
    this.clock = {};
  }

  increment(key) {
    if (!this.clock[key]) {
      this.clock[key] = 0;
    }
    this.clock[key]++;
  }

  get(key) {
    return this.clock[key];
  }

  set(key, value) {
    this.clock[key] = value;
  }

  compare(key, value) {
    if (this.clock[key] === value) {
      return 0;
    } else if (this.clock[key] > value) {
      return 1;
    } else {
      return -1;
    }
  }

  merge(other) {
    for (let key in other.clock) {
      if (!this.clock[key] || this.clock[key] < other.clock[key]) {
        this.clock[key] = other.clock[key];
      }
    }
  }

  toObj(json) {
    this.clock = JSON.parse(json);
  }

}

function createVectorClock(str) {
  let vc = new VectorClock();
  vc.toObj(str);
  return vc;
}

class WebSocketConnection {
  constructor(server) {
    this.socket = io(server, {
      autoConnect: false
    });
    this.em = new EventEmitter();
    this.vc = undefined;
  }

  bindIncomingEvents() {
    this.socket.on('connect', () => {
      this.em.emit('connected');
    });
    this.socket.on('connect_error', (error) => {
      if (this.socket.active) {
        console.log('connect_error', error);
      } else {
        this.em.emit('connect_error', error);
      }
    });

    this.socket.on('disconnect', () => {
      this.em.emit('disconnect');
    });

    this.socket.on('message', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('message', message.data);
    });

    this.socket.on('room-joined', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('room-joined', message.data);
    });
    this.socket.on('room-left', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('room-left', message.data);
    });

    this.socket.on('webrtc-offer', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('webrtc-offer', message.data);
    });
    this.socket.on('webrtc-answer', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('webrtc-answer', message.data);
    });
    this.socket.on('webrtc-candidate', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('webrtc-candidate', message.data);
    });

  }

  bindOutgoingEvents() {
    this.em.on('room-enter', (data) => {
      this.vc = new VectorClock()
      this.vc.increment(this.socket.id);
      this.socket.emit('room-enter', this.createMessage(data), (response) => {
        this.vc.increment(this.socket.id);
        let svc = createVectorClock(response.clock);
        this.vc.merge(svc);
        this.em.emit('room-entered', response.data);
      });
    });
    this.em.on('room-exit', (data) => {
      this.vc.increment(this.socket.id);
      this.socket.emit('room-exit', this.createMessage(data), (response) => {
        this.vc = undefined;
        this.em.emit('room-exited', response.data);
      });
    });
    this.em.on('webrtc-offer', (data) => {
      this.vc.increment(this.socket.id);
      this.socket.emit('webrtc-offer', this.createMessage(data));
    });
    this.em.on('webrtc-answer', (data) => {
      this.vc.increment(this.socket.id);
      this.socket.emit('webrtc-answer', this.createMessage(data));
    });
    this.em.on('webrtc-candidate', (data) => {
      this.vc.increment(this.socket.id);
      this.socket.emit('webrtc-candidate', this.createMessage(data));
    });
  }

  createMessage(data) {
    return {
      method: 'ws',
      clock: this.vc.clock,
      data: data
    };
  }

}

function createWebSocketConnection(server) {
  let wsc = new WebSocketConnection(server);
  wsc.bindIncomingEvents();
  wsc.bindOutgoingEvents();
  return wsc;
}

export default createWebSocketConnection;
