import io from 'socket.io-client';
import EventEmitter from 'events';
import {createVectorClock, VectorClock} from './vc';

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
      console.log("room-joined");
      
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
      let data = message.data;
      data['sid'] = message.from;
      this.em.emit('new-webrtc-offer', data);
    });
    this.socket.on('webrtc-answer', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      let data = message.data;
      data['sid'] = message.from;
      this.em.emit('new-webrtc-answer', data);
    });
    this.socket.on('webrtc-candidate', (message) => {
      this.vc.increment(this.socket.id);
      let svc = createVectorClock(message.clock);
      this.vc.merge(svc);
      this.em.emit('new-webrtc-candidate', message.data);
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
    this.em.on('send-webrtc-offer', (offer) => {
      let sid = offer.sid;
      let uuid = offer.uuid;
      let sdp = offer.sdp;
      let data = {
        uuid: uuid,
        sdp: sdp
      };
      this.vc.increment(this.socket.id);
      let message = this.createMessage(data);
      message.to = sid;
      this.socket.emit('webrtc-offer', message);
    });
    this.em.on('send-webrtc-answer', (answer) => {
      let sid = answer.sid;
      let uuid = answer.uuid;
      let sdp = answer.sdp;
      let data = {
        uuid: uuid,
        sdp: sdp
      };
      this.vc.increment(this.socket.id);
      let message = this.createMessage(data);
      message.to = sid;
      this.socket.emit('webrtc-answer', message);
    });
    this.em.on('send-webrtc-candidate', (cand) => {
      let sid = cand.sid;
      let uuid = cand.uuid;
      let candidate = cand.candidate;
      let data = {
        uuid: uuid,
        candidate: candidate
      };
      this.vc.increment(this.socket.id);
      let message = this.createMessage(data);
      message.to = sid;
      this.socket.emit('webrtc-candidate', message);
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
