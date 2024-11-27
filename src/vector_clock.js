class VectorClock {
    constructor() {
        this.clientId = this.createId()
        this.clock = { [this.clientId]: 0 }
    }

    createId() {
        return Math.floor(Math.random() * 999999)
    }

    increment() {
        this.clock[this.clientId] += 1
    }

    merge(receivedClock) {
        // receivedClock: clock object in class
        for (const [id, value] of Object.entries(receivedClock)) {
            this.clock[id] = Math.max(this.clock[id] || 0, value)
        }
    }

    validateMessageOrder(senderId, receivedClock) {
        // Expect only senderId to increament their clock
        if (receivedClock[senderId] == this.clock[senderId] + 1) {
            console.log("Message received in order")
            return true
        }
        console.log("Message received out of order")
        return false
    }

    handleOutOfOrderMessage(clock) {
        // TODO save out-of-order message to in memory list
        // loop through out of order messages to see if any can be consumed
    }
}

export default VectorClock