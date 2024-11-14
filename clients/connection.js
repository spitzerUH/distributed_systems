const { io } = require("socket.io-client");

export class Connection {
    constructor(server) {
        this.socket = io(server, { autoConnect: false });
        this.socket.connect();
    }
}