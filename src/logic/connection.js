import { PC_CONFIG } from "+logic/PC_CONFIG";
import VectorClock from "./vector_clock.js"

const { io } = require("socket.io-client");

const dataChannelParams = { ordered: true, negotiated: true, id: 0 };

export class Connection {
  constructor(server) {
    this.socket = io(server, { autoConnect: false });
    this.room_code = null;
    this.clients = {};
    this.handleRoomJoined();
    this.handleWebRTCOffer();
    this.handleWebRTCAnswer();
    this.handleWebRTCCandidate();
    this.clock = null;
    this.socket.on('connect', () => {
      this.clock = new VectorClock(this.socket.id);
    });
    this.socket.connect();
  }

  get room() {
    return this.room_code;
  }

  enterRoom(room_code = '') {
    return new Promise((resolve, reject) => {
      this.socket.emit('room-enter', {
        'room_code': room_code
      }, (response) => {
        this.room_code = response.room_code;
        resolve(this.room_code);
      });
    });
  }

  exitRoom() {
    return new Promise((resolve, reject) => {
      if (!this.room_code) {
        reject('Not in a room');
      }
      this.socket.emit('room-exit', {
        'room_code': this.room_code
      }, (response) => {
        this.room_code = null;
        this.clearConnections().then(() => {
          resolve(this.room_code);
        });
      });
    });
  }

  handleRoomJoined() {
    this.socket.on('room-joined', (message) => {
      let session_id = message.session_id;
      let pc = this.createPeerConnection(session_id);
      pc.createOffer().then((sdp) => {
        pc.setLocalDescription(sdp);
        this.socket.emit('webrtc-offer', { to: session_id, data: sdp });
      });
    });
  }

  handleWebRTCOffer() {
    this.socket.on('webrtc-offer', (message) => {
      let session_id = message.from;
      let pc = this.createPeerConnection(session_id);
      pc.setRemoteDescription(new RTCSessionDescription(message.data));
      pc.createAnswer().then((sdp) => {
        pc.setLocalDescription(sdp);
        this.socket.emit('webrtc-answer', { to: session_id, data: sdp });
      });
    });
  }
  handleWebRTCAnswer() {
    this.socket.on('webrtc-answer', (message) => {
      let session_id = message.from;
      let pc = this.clients[session_id]['pc'];
      pc.setRemoteDescription(new RTCSessionDescription(message.data));
    });
  }
  handleWebRTCCandidate() {
    this.socket.on('webrtc-candidate', (message) => {
      let session_id = message.from;
      let pc = this.clients[session_id]['pc'];
      pc.addIceCandidate(new RTCIceCandidate(message.data));
    });
  }

  createPeerConnection(session_id) {
    let pc = new RTCPeerConnection(PC_CONFIG);
    pc.ondatachannel = (event) => {
      event.channel.onmessage = (e) => {
        this.dataChannelMessage(session_id, e.message);
      };
    };
    let dc = pc.createDataChannel('messaging-channel', dataChannelParams);
    dc.binaryType = 'arraybuffer';
    dc.addEventListener('open', () => {
      this.dataChannelOpen(session_id);
    });
    dc.addEventListener('close', () => {
      this.dataChannelClose(session_id);
    });
    dc.addEventListener('message', (event) => {
      this.dataChannelMessage(session_id, event);
    });
    this.clients[session_id] = { pc: pc, dc: dc };
    pc.oniceconnectionstatechange = () => {
      //console.log(pc.iceConnectionState);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-candidate', { to: session_id, data: event.candidate });
      }
    };
    pc.onicecandidateerror = (error) => {
      //console.error(error);
    };
    return pc;
  }

  clearConnections() {
    return new Promise((resolve, reject) => {
      var promises = [];
      Object.entries(this.clients).forEach(([sid, conns]) => {
        let dc = conns.dc;
        let pc = conns.pc;
        promises.push(new Promise((res, rej) => {
          dc.removeEventListener('close', this.dataChannelClose);
          dc.addEventListener('close', () => {
            delete this.clients[sid];
            res();
          });
          pc.close();
        }));
      });
      Promise.all(promises).then(() => {
        resolve();
      })
    });
  }

  dataChannelOpen(session_id) {
    console.log('Data channel open for', session_id);
    this.gameChannelOpen(session_id);
  }

  dataChannelClose(session_id) {
    delete this.clients[session_id];
    console.log('Data channel closed for', session_id);
    this.gameChannelClose(session_id);
  }

  // Receive datachannel message
  dataChannelMessage(session_id, event) {
    let message = undefined;
    try {
      message = JSON.parse(event.data);
    } catch (e) {
      message = event.data;
    }
    // handle clock and return consumable messages IN ORDER
    const consumableMessages = this.handleClockAndMessageQueue(message)
    for (let i = 0; i < consumableMessages.length; i++) {
      const consumableMessage = consumableMessages[i]
      if (consumableMessage.platform === 'game') {
        this.gameChannelMessage(session_id, message.data);
      } else {
        console.log(event);
      }
    }
  }

  sendMessage(message) {
    this.clock.increment()
    return new Promise((resolve, reject) => {
      let payload = undefined;
      if (typeof message === 'string') {
        payload = message;
      } else {
        payload = JSON.stringify(message);
      }
      if (!!payload) {
        Object.entries(this.clients).forEach(([sid, conns]) => {
          conns.dc.send(payload);
        });
        resolve();
      } else {
        reject(`Problem to send the following message: ${message}`);
      }
    });
  }

  sendGameMessage(message) {
    const wrappedMessage = this.wrapGameMessage(message)
    return this.sendMessage(wrappedMessage);
  }

  wrapGameMessage(data) {
    const wrapped = JSON.stringify({
      "clientId": this.clock.clientId,
      "clock": this.clock.clock,
      "platform": "game",
      "data": data
    })
    return wrapped
  }

  handleClockAndMessageQueue(message) {
    const clientId = message.clientId
    const receivedClock = message.clock
    // check if client is known
    if (!this.clientVectorValueExists(clientId)) {
      console.log(`Added client ${clientId} to local clock`)
      this.clock.merge(receivedClock)
    }
    if (this.clock.validateMessageOrder(clientId, receivedClock)) {
      // Message was in order
      this.clock.merge(receivedClock)
    }
    else {
      console.log("Message received OUT OF ORDER")
      this.clock.pushToOutOfOrderMessageQueue(clientId, receivedClock)
    }
    return this.clock.getOldMessagesFromQueue(clientId, receivedClock)
  }

  clientVectorValueExists(clientId) {
    if (clientId in this.clock.clock) {
      return true
    }
    return false
  }
}
