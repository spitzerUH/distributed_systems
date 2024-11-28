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
    console.log("--------- Starting old message ordering -----")
    let consumableOldMessages = []
    let tempClock = structuredClone(this.clock)

        for (let i = 0; i < this.outOfOrderMessageQueue.length; i++) {
            const i_message = this.outOfOrderMessageQueue[i] 
            const i_messageSender = Object.keys(i_message)[0]
            const i_messageClock = i_message[i_messageSender]
            //console.log("Checking if possible to consume old message", message)
            //console.log(messageClock[messageSender],"==",tempClock[messageSender]+1)

            for (let y = 0; y < this.outOfOrderMessageQueue.length; y++) {
                if (this.validateMessageOrder(i_messageSender, i_messageClock)) {
                    console.log("Old consumable message found")
                    consumableOldMessages.push(i_message)
                    tempClock[i_message.clientId] += 1
            }
            }
            
        }
        console.log("----- Finished ordering old messages, result:")
        console.log(consumableOldMessages)
        return consumableOldMessages
    }

  pushToOutOfOrderMessageQueue(clientId, clock) {
    this.outOfOrderMessageQueue.push({ clientId, clock })
  }
}

export default VectorClock
