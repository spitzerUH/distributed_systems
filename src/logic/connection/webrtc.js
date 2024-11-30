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
    this.em.on('start-connection', () => {
      this.peerConnection.createOffer().then((sdp) => {
        this.peerConnection.setLocalDescription(sdp).then(() => {
          this.em.emit('send-webrtc-offer', sdp);
        });
      });
    });
    this.em.on('got-webrtc-offer', (data) => {
      let sdp = new RTCSessionDescription(data);
      this.peerConnection.setRemoteDescription(sdp).then(() => {
        this.peerConnection.createAnswer().then((sdp) => {
          this.peerConnection.setLocalDescription(sdp).then(() => {
            this.em.emit('send-webrtc-answer', sdp);
          }).catch((error) => {
            console.error(error);
          });
        });
      });
    });
    this.em.on('got-webrtc-answer', (data) => {
      let sdp = new RTCSessionDescription(data);
      this.peerConnection.setRemoteDescription(sdp).then(() => {
        console.log('WebRTC connection established');
      }).catch((error) => {
        console.error(error);
      });
    });
    this.em.on('got-webrtc-candidate', (data) => {
      let candidate = new RTCIceCandidate(data);
      this.peerConnection.addIceCandidate(candidate).then(() => {
        console.log('WebRTC candidate added');
      }).catch((error) => {
        console.error(error);
      });
    });
  }

  bindConnectionEvents() {
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log(this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.em.emit('send-webrtc-candidate', event.candidate);
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
