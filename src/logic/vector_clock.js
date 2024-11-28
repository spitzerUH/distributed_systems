class VectorClock {
  constructor(id) {
    this.clientId = id;
    this.clock = {};
    this.clock[this.clientId] = 0;
    this.outOfOrderMessageQueue = [];
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

  validateMessageOrder(clientId, receivedClock) {
    // Expect only senderId to increament their clock
    if (receivedClock[clientId] == this.clock[clientId] + 1) {
      return true
    }
    return false
  }

  getOldMessagesFromQueue() {
    // Return consumable old messages in consumable order
    let consumableOldMessages = []
    let tempClock = structuredClone(this.clock)

    for (let i = 0; i < this.outOfOrderMessageQueue.length; i++) {
      const message = this.outOfOrderMessageQueue[i]
      console.log("Checking if possible to consume old message", message)
      console.log(message.clock[clientId], "==", tempClock[clientId] + 1)
      if (this.validateMessageOrder(message.clientId, message.clock)) {
        console.log("Old consumable message found")
        consumableOldMessages.push(message)
        tempClock[message.clientId] += 1
      }
    }
    return consumableOldMessages
  }

  pushToOutOfOrderMessageQueue(clientId, clock) {
    this.outOfOrderMessageQueue.push({ clientId, clock })
  }
}

export default VectorClock
