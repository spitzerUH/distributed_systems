class BufferMessage {
  constructor(senderId, message, clock) {
    this.senderId = senderId
    this.message = message
    this.clock = clock
  }
}


class VectorClock {
  constructor(incomingClock = null) {
    this.clock = incomingClock ? { ...incomingClock } : {};
    this.messageBuffer = []
  }

  increment(key) {
    if (!this.clock[key]) {
      this.clock[key] = 0;
    }
    this.clock[key]++;
  }

  get(key) {
    return this.clock[key];
  }

  set(key, value) {
    this.clock[key] = value;
  }

  merge(other) {
    for (let key in other.clock) {
      if (!this.clock[key] || this.clock[key] < other.clock[key]) {
        this.clock[key] = other.clock[key];
      }
    }
  }

  fromStr(str) {
    this.clock = JSON.parse(str);
  }

  fromJSON(json) {
    this.clock = json;
  }

  appendToQueue(senderId, message, clock) {
    const bufferMessage = new BufferMessage(senderId, message, clock)
    this.messageBuffer.push(bufferMessage)
  }

  getConsumableMessages(data) {
    const message = data.data;
    const senderId = data.senderId;
    const receivedClock = createVectorClock(data.clock);
    // console.log("Starting handling of received message, clock", receivedClock)
    let orderedMessages = []

    let result = this.compare(receivedClock)
    // console.log("Comparison result", result)

    if (result == "after") {
      // message came early
      this.appendToQueue(senderId, message, clock)
    }
    else {
      orderedMessages.push(message)
    }

    this.tryConsumingFromBuffer(orderedMessages)

    // console.log("Returning messages", orderedMessages)
    return orderedMessages
  }

  tryConsumingFromBuffer(orderedMessages) {
    // console.log("tryConsumingFromBuffer starting")
    let madeProgress = true;
    while (madeProgress) {
      madeProgress = false;

      for (let i = 0; i < this.messageBuffer.length; i++) {
        const bufferedMessage = this.messageBuffer[i];
        const bufferedClock = new VectorClock(bufferedMessage.clock);

        const comparison = bufferedClock.compare(this);

        if (comparison === "before" || comparison === "equal") {
          orderedMessages.push(bufferedMessage);
          this.merge(bufferedClock);
          this.messageBuffer.splice(i, 1);
          i--;
          madeProgress = true;
        }
      }
    }
  }

  compare(receivedClock) {
    let isLess = false, isGreater = false;

    const allNodes = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(receivedClock.clock)
    ]);

    for (const nodeId of allNodes) {
      const thisValue = this.clock[nodeId] || 0;
      const otherValue = receivedClock.clock[nodeId] || 0;

      if (thisValue < otherValue) isLess = true;
      if (thisValue > otherValue) isGreater = true;

      if (isLess && isGreater) {
        return "concurrent";
      }
    }

    return isLess ? "before" : (isGreater ? "after" : "equal");
  }

}

function createVectorClock(str) {
  let vc = new VectorClock();
  try {
    vc.fromStr(str);
  } catch (error) {
    vc.fromJSON(str);
  }
  return vc;
}

export { VectorClock, createVectorClock };
