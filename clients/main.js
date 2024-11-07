const SIGNALING_SERVER_URL = 'http://localhost:9999';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on('newclient', () => {
    console.log('New client just joined');
});

// For now just connect
socket.connect();