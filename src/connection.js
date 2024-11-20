const { io } = require("socket.io-client");

const PC_CONFIG = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "64a48bc463c9431622d2fb77",
      credential: "Shbj2tDls5FUddly",
    },
  ]
};
const dataChannelParams = { ordered: true, negotiated: true, id: 0 };

export class Connection {
  constructor(server) {
    this.socket = io(server);
    this.room_code = null;
    this.clients = {};
    this.handleRoomJoined();
    this.handleWebRTCOffer();
    this.handleWebRTCAnswer();
    this.handleWebRTCCandidate();
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
        resolve(this.room_code);
      });
    });
  }

  handleRoomJoined() {
    this.socket.on('room-joined', (message) => {
      let session_id = message.session_id;
      console.log('New client joined the room,', session_id);
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
      console.log('Got new offer from', session_id);
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
      console.log('Got new answer from', session_id);
      let pc = this.clients[session_id]['pc'];
      pc.setRemoteDescription(new RTCSessionDescription(message.data));
    });
  }
  handleWebRTCCandidate() {
    this.socket.on('webrtc-candidate', (message) => {
      let session_id = message.from;
      console.log('Got new ICE candidate from', session_id);
      console.log(message.data);
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
    let candidates = [];
    pc.oniceconnectionstatechange = () => {
      console.log(pc.iceConnectionState);
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate);
        this.socket.emit('webrtc-candidate', { to: session_id, data: event.candidate });
      } else {
        console.log("ice candidate", event);
      }
    };
    pc.onicegatheringstatechange = () => {
      console.log(pc.iceGatheringState);
      if (pc.iceGatheringState === 'complete') {
        console.log("ICE done");
        console.log(candidates);
      }
    };
    pc.onicecandidateerror = (error) => {
      //console.error(error);
    };
    return pc;
  }

  dataChannelOpen(session_id) {
    console.log('Data channel open for', session_id);
    this.openDataChannel(session_id);
  }

  dataChannelClose(session_id) {
    console.log('Data channel closed for', session_id);
  }

  dataChannelMessage(session_id, event) {
    console.log(event);
    this.receivedMessage(session_id, event.data);
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      Object.entries(this.clients).forEach(([sid, conns]) => {
        conns.dc.send(message);
      });
      resolve();
    });
  }
}
