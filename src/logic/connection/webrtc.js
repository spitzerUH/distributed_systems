import EventEmitter from 'events';

class WebRTCConnection {

  constructor() {
    this.peerConnections = {};
    this.em = new EventEmitter();
  }

}

function createWebRTCConnection() {
  let webrtc = new WebRTCConnection();
  return webrtc;
}

export default createWebRTCConnection;
