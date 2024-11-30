import EventEmitter from 'events';
import { PC_CONFIG, DC_CONFIG } from '+config/webrtc';

class WebRTCConnection {

  constructor() {
    this.peerConnection = new RTCPeerConnection(PC_CONFIG);
    this.dataChannel = this.peerConnection.createDataChannel('messages', DC_CONFIG);
    this.dataChannel.binaryType = 'arraybuffer';
    this.em = new EventEmitter();
  }

  bindEmitterEvents() {
    this.em.on('start-connection', (data) => {
      console.log('start-connection', data);
      this.peerConnection.createOffer().then((sdp) => {
        this.peerConnection.setLocalDescription(sdp).then(() => {
          this.em.emit('send-webrtc-offer', sdp);
        });
      });
    });
    this.em.on('webrtc-offer', (data) => {
    });
    this.em.on('webrtc-answer', (data) => {
    });
    this.em.on('webrtc-candidate', (data) => {
    });
  }

  bindConnectionEvents() {
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.em.emit('webrtc-candidate', event.candidate);
      }
    };

    this.peerConnection.onicecandidateerror = (error) => {
    };
  }

  bindDataChannelEvents() {
    this.dataChannel.addEventListener('open', () => {
    });

    this.dataChannel.addEventListener('close', () => {
    });

    this.dataChannel.addEventListener('message', (event) => {
    });
  }

}

function createWebRTCConnection() {
  let webrtc = new WebRTCConnection();
  webrtc.bindEmitterEvents();
  webrtc.bindConnectionEvents();
  webrtc.bindDataChannelEvents();
  return webrtc;
}

export default createWebRTCConnection;
