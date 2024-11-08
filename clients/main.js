const SIGNALING_SERVER_URL = 'http://localhost:9999';
const PC_CONFIG = {};
const dataChannelParams = {ordered: true, negotiated: true, id: 0};

let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

let pc1;
let dataChannel1;

socket.on('newclient', () => {
    console.info('New client just joined');
    pc1 = createPeerConnection();
    dataChannel1 = createDataChannel(pc1);
    sendOffer(pc1);
});

socket.on('data', (data) => {
    console.debug('Data received: ', data);
    processSignalingData(data);
});

let createPeerConnection = () => {
    console.debug('createPeerConnection');
    let pc;
    try {
        pc = new RTCPeerConnection(PC_CONFIG);
        pc.onicecandidate = onIceCandidate;
        return pc;
    } catch(error) {
        console.error('createPeerConnection');
    }
};

let createDataChannel = (pc) => {
    let dc = pc.createDataChannel('messaging-channel', dataChannelParams);
    return dc;
};

let onIceCandidate = (event) => {
    if (event.candidate) {
        console.log("ICE candidate");
        socket.emit('data', {
            type: 'candidate',
            candidate: event.candidate
        });
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

let sendAnswer = (pc) => {
    console.debug('sendAnswer');
    pc.createAnswer().then((sessionDescription) => {
        console.log(sessionDescription);
        pc.setLocalDescription(sessionDescription);
        socket.emit('data', sessionDescription);
    }, (error) => {
        console.error(error);
    });
};

let processSignalingData = (data) => {
    switch (data.type) {
        case 'offer':
            pc1 = createPeerConnection();
            pc1.setRemoteDescription(new RTCSessionDescription(data));
            sendAnswer(pc1);
            break;
        case 'answer':
            pc1.setRemoteDescription(new RTCSessionDescription(data));
            break;
        case 'candidate':
            pc1.addIceCandidate(new RTCIceCandidate(data.candidate));
            break;
    }
};

// For now just connect
socket.connect();