import createWebRTCConnection from './webrtc';
import createWebSocketConnection from './websocket';

class ConnectionManager {
  constructor(server) {
    this.wsc = createWebSocketConnection(server);
    this.webrtc = createWebRTCConnection();
  }
}

export default ConnectionManager;
