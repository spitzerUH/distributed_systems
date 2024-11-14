const { io } = require("socket.io-client");

const PC_CONFIG = {};

export class Connection {
    constructor(server) {
        this.socket = io(server, { autoConnect: false });
        this.socket.connect();
        this.room_code = null;
        this.p2p_connections = {};
        this.socket.on('room-joined', (message) => {this.roomJoined(this, message) });
        this.socket.on('webrtc-offer', (message) => {this.offer(this, message)});
    }

    get room() {
        return this.room_code;
    }

    enterRoom(room_code = '') {
        this.socket.emit('room-enter', {
            'room_code': room_code
        }, (response) => {
            this.room_code = response.room_code;
        });
    }

    exitRoom() {
        if (!this.room_code)
            throw 'Not in a room';
        this.socket.emit('room-exit', {
            'room_code': this.room_code
        }, (response) => {
            this.room_code = null;
        });
    }

    roomJoined(conn, message) {
        let session_id = message.session_id;
        console.log('New client joined the room,', session_id);
        let pc = new RTCPeerConnection(PC_CONFIG);
        conn.p2p_connections[session_id] = pc;
        pc.createOffer().then((sdp) => {
            pc.setLocalDescription(sdp);
            conn.socket.emit('webrtc-offer', {'to':session_id, 'data': sdp});
        });
    }

    offer(conn, message) {
        let session_id = message.from;
        console.log('Got new offer from', session_id);
        let pc = new RTCPeerConnection(PC_CONFIG);
        conn.p2p_connections[session_id] = pc;
        pc.setRemoteDescription(new RTCSessionDescription(message.data));
    }
}