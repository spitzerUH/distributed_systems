class VectorClock {
    constructor(clientId) {
        this.clientId = clientId;
        this.clock = { [clientId]: 0 }; 
    }

    increment() {
        this.clock[this.clientId] += 1;
    }

    merge(receivedClock) {
        // receivedClock: clock object in class
        for (const [id, value] of Object.entries(receivedClock)) {
            this.clock[id] = Math.max(this.clock[id] || 0, value);
        }
    }


}