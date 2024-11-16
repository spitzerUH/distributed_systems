const { io } = require("socket.io-client");

const PC_CONFIG = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:5349" },
        { urls: "stun:stun1.l.google.com:3478" },
        { urls: "stun:stun1.l.google.com:5349" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:5349" },
        { urls: "stun:stun3.l.google.com:3478" },
        { urls: "stun:stun3.l.google.com:5349" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:5349" }
    ]
};
const dataChannelParams = {ordered: true, negotiated: true, id: 0};

export class Connection {
    constructor(server) {
        this.socket = io(server);
        this.room_code = null;
        this.clients = {};
        this.addRoomJoined();
        this.addWebRTCOffer();
        this.addWebRTCAnswer();
        this.addWebRTCCandidate();
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

    addRoomJoined() {
        this.socket.on('room-joined', (message) => {
            let session_id = message.session_id;
            console.log('New client joined the room,', session_id);
            let pc = this.createPeerConnection(session_id);
            let dc = this.createDataChannel(pc);
            this.clients[session_id] = {pc:pc, dc:dc};
            pc.createOffer().then((sdp) => {
                pc.setLocalDescription(sdp);
                this.socket.emit('webrtc-offer', {to:session_id, data: sdp});
            });
        });
    }

    addWebRTCOffer() {
        this.socket.on('webrtc-offer', (message) => {
            let session_id = message.from;
            console.log('Got new offer from', session_id);
            let pc = this.createPeerConnection(session_id);
            let dc = this.createDataChannel(pc);
            this.clients[session_id] = {pc:pc, dc:dc};
            pc.setRemoteDescription(new RTCSessionDescription(message.data));
            pc.createAnswer().then((sdp) => {
                pc.setLocalDescription(sdp);
                this.socket.emit('webrtc-answer', {to:session_id, data: sdp});
            });
        });
    }
    addWebRTCAnswer() {
        this.socket.on('webrtc-answer', (message) => {
            let session_id = message.from;
            console.log('Got new answer from', session_id);
            let pc = this.clients[session_id]['pc'];
            pc.setRemoteDescription(new RTCSessionDescription(message.data));
        });
    }
    addWebRTCCandidate() {
        this.socket.on('webrtc-candidate', (message) => {
            let session_id = message.from;
            console.log('Got new ICE candidate from', session_id);
            let pc = this.clients[session_id]['pc'];
            pc.addIceCandidate(new RTCIceCandidate(message.data));
        });
    }

    createPeerConnection(session_id) {
        let pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE candidate');
                this.socket.emit('webrtc-candidate', {to:session_id, data: event.candidate});
            }
        };
        return pc;
    }

    createDataChannel(pc) {
        let dc = pc.createDataChannel('messaging-channel', dataChannelParams);
        dc.binaryType = 'arraybuffer';
        dc.addEventListener('open', () => {
            this.dataChannelOpen();
        });
        dc.addEventListener('close', () => {
            this.dataChannelClose();
        });
        dc.addEventListener('message', (event) => {
            this.dataChannelMessage(event.data);
        });
        return dc;
    }

    dataChannelOpen() {
        console.log('Data channel open!');
    }

    dataChannelClose() {
        console.log('Data channel closed!');
    }

    dataChannelMessage(message) {
        console.log('Message:', message);
    }

    sendMessage(message) {
        return new Promise((resolve, reject) => {
            Object.entries(this.clients).forEach( ([sid, conns]) => {
                conns.dc.send(message);
            });
            resolve();
        });
    }
}