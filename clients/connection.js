const { io } = require("socket.io-client");

export class Connection {
    constructor(server) {
        this.socket = io(server, { autoConnect: false });
        this.socket.connect();
        this.room_code;
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
}