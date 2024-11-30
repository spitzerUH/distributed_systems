class VectorClock {
  constructor() {
    this.clock = {};
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

  compare(key, value) {
    if (this.clock[key] === value) {
      return 0;
    } else if (this.clock[key] > value) {
      return 1;
    } else {
      return -1;
    }
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
