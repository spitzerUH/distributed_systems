const { io } = require("socket.io-client");

export class Connection {
    constructor(server) {
        this.socket = io(server, { autoConnect: false });
        this.socket.connect();
        this.room_code = null;
        this.socket.on('room-joined', this.roomJoined);
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

    roomJoined(message) {
        console.log('New client joined the room,', message.session_id);
        console.log(message);
    }
}