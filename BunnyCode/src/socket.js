export default class Socket {
  constructor(ws) {
    this.ws = ws;
  }
  socketOn(name, cb) {
    this.ws.on(name, cb);
  }
  socketOff(name) {
    this.ws.removeAllListeners(name);
  }
  socketEmit(name, data){
    this.ws.emit(name, data);
  }
  socketDisconnect(){
    this.ws.disconnect();
  }
};