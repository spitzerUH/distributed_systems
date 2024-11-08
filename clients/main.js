const SIGNALING_SERVER_URL = 'http://localhost:9999';

let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on('newclient', () => {
    console.log('New client just joined');
});

socket.on('data', (data) => {
    console.log('Data received: ', data);
});


// For now just connect
socket.connect();

// Send random data using console to try out
//socket.emit('data', 'foobar');