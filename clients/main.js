const SIGNALING_SERVER_URL = 'http://localhost:9999';
const PC_CONFIG = {};

let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

let pc1;

socket.on('newclient', () => {
    console.info('New client just joined');
    pc1 = createPeerConnection();
    sendOffer(pc1);
});

socket.on('data', (data) => {
    console.info('Data received: ', data);
});

let createPeerConnection = () => {
    console.debug('createPeerConnection');
    let pc;
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        return pc;
    } catch(error) {
        console.error('createPeerConnection');
    }
};

let sendOffer = (pc) => {
    console.debug('sendOffer');
    pc.createOffer().then((sessionDescription) => {
        console.log(sessionDescription);
        pc.setLocalDescription(sessionDescription);
        socket.emit('data', sessionDescription);
    }, (error) => {
        console.error(error);
    });
};

// For now just connect
socket.connect();