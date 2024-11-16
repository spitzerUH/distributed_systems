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
        this.socket.on('room-joined', (message) => {this.roomJoined(this, message) });
        this.socket.on('webrtc-offer', (message) => {this.offer(this, message)});
        this.socket.on('webrtc-answer', (message) => {this.answer(this, message)});
        this.socket.on('webrtc-candidate', (message) => {this.candidate(this, message)});
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

    roomJoined(conn, message) {
        let session_id = message.session_id;
        console.log('New client joined the room,', session_id);
        let pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('ICE candidate');
                conn.socket.emit('webrtc-candidate', {'to':session_id, 'data': event.candidate});
            }
        };
        let dc = conn.createDataChannel(pc);
        conn.clients[session_id] = {'pc':pc, 'dc':dc};
        pc.createOffer().then((sdp) => {
            pc.setLocalDescription(sdp);
            conn.socket.emit('webrtc-offer', {'to':session_id, 'data': sdp});
        });
    }

    offer(conn, message) {
        let session_id = message.from;
        console.log('Got new offer from', session_id);
        let pc = new RTCPeerConnection(PC_CONFIG);
        let dc = conn.createDataChannel(pc);
        conn.clients[session_id] = {'pc':pc, 'dc':dc};
        pc.setRemoteDescription(new RTCSessionDescription(message.data));
        pc.createAnswer().then((sdp) => {
            pc.setLocalDescription(sdp);
            conn.socket.emit('webrtc-answer', {'to':session_id, 'data': sdp});
        });
    }

    answer(conn, message) {
        let session_id = message.from;
        console.log('Got new answer from', session_id);
        let pc = conn.clients[session_id]['pc'];
        pc.setRemoteDescription(new RTCSessionDescription(message.data));
    }

    candidate(conn, message) {
        let session_id = message.from;
        console.log('Got new ICE candidate from', session_id);
        let pc = conn.clients[session_id]['pc'];
        pc.addIceCandidate(new RTCIceCandidate(message.data));
    }

    createDataChannel(pc) {
        let dc = pc.createDataChannel('messaging-channel', dataChannelParams);
        dc.binaryType = 'arraybuffer';
        dc.addEventListener('open', () => {
            console.log('Data channel open!');
        });
        dc.addEventListener('close', () => {
            console.log('Data channel closed!');
        });
        dc.addEventListener('message', (event) => {
            console.log('Message: ' + event.data);
        });
        return dc;
    }

    sendMessage(message) {
        Object.entries(this.clients).forEach( ([sid, conns]) => {
            conns.dc.send(message);
        });
    }
}