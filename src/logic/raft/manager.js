import {
  formatRaftElectionRequest,
  formatRaftElectionVote,
  formatRaftElectionLeader,
} from './message';

class RaftManager {
  constructor(cm) {
    this.cm = cm;
    this.currentTerm = 0;
    this.gotVotes = 0;
    // 0 - Follower, 1 - candidate, 2 - leader
    this.state = 0;
    this.heartbearInterval = undefined;
    this.currentElectionTimeout = undefined;
  }

  get uuid() {
    return this.cm.id;
  }

  get participants() {
    return this.cm.connections + 1;
  }

  get votesNeeded() {
    return this.participants / 2;
  }

  get isLeader() {
    return this.state == 2;
  }

  initRaftConsensus() {
    // maybe get data from localstorage/sessionstorage
    this.currentTerm = 0;
    if (this.heartbearInterval) {
      clearInterval(this.heartbearInterval);
      this.heartbearInterval = undefined;
    }

    this.currentElectionTimeout = setTimeout(
      this.startElection.bind(this),
      this.getRandomTime()
    );
  }

  stopRaftConsensus() {
    if (this.heartbearInterval) {
      clearInterval(this.heartbearInterval)
      this.heartbearInterval = undefined;
    }
    if (this.currentElectionTimeout) {
      clearTimeout(this.currentElectionTimeout)
      this.currentElectionTimeout = undefined;
    }
  }

  startElection() {
    if (this.state == 2) {
      console.error(`You shouldn't start a vote! You are the leader`);
      return;
    }

    this.restartElectionTimer();

    this.state = 1;
    this.currentTerm++;
    this.voteFor = this.uuid;
    this.currentTerm;
    this.gotVotes = 1;

    const message = formatRaftElectionRequest(this.currentTerm, this.uuid);

    this.cm.sendRaftMessage(message);

  }

  handleRaftMessage(message) {
    switch (message.type) {
      case 'raft-election-request':
        if (this.state == 2) {
          console.log(`Can't vote for someone else as leader`);
          break;
        }

        this.currentTerm = message.data.term;
        // respond to election either with vote or not
        if (!this.voteFor) {
          // send positiv vote
          this.voteFor = message.data.requestFrom;
        } else {
          // send negative vote
        }

        const voteMessage = formatRaftElectionVote(
          this.currentTerm,
          this.voteFor
        );
        this.cm.sendRaftMessageTo(message.data.requestFrom, voteMessage);
        break;
      case 'raft-election-vote':
        if (this.state == 2) {
          console.log(`Can't get a vote as leader`);
          break;
        }
        if (this.voteFor && this.voteFor == this.uuid) {
          // got positive vote
          this.gotVotes++;
          if (this.gotVotes > this.votesNeeded) {
            console.log(
              `you are leader now (got ${this.gotVotes} of ${this.votesNeeded} needed)`
            );
            this.state = 2;
            this.cm.events.emit('leader-change', this.uuid, this.state, message.type);
            // start leader heardbeat you are the leader now
            this.heartbearInterval = setInterval(
              this.startLeaderHeartbeat.bind(this),
              100
            );
          }
        } else {
          if (!this.voteFor) {
            console.error(
              `got a vote but not voted vor self, shouldn't be possible`
            );
          }
          // Voted for someone else
          console.log(`Voted for someone else ${this.voteFor}`);
        }
        break;

      case 'raft-election-leader':
        if(this.state == 2){
          console.log("got leader signal but is leader");
          this.state = 1;

          this.restartElectionTimer()
        }
        this.state = 1;
        this.voteFor = message.data.currentLeader;
        this.cm.events.emit('leader-change', message.data.currentLeader, this.state, message.type);
        break;
      default:
        console.error(
          `Can't handle raft consensus message type: ${message.type}`
        );
        break;
    }

    this.restartElectionTimer();
  }

  restartElectionTimer() {
    if (this.currentElectionTimeout) {
      clearTimeout(this.currentElectionTimeout);
      this.currentElectionTimeout = undefined;
    }

    if (this.currentElectionTimeout) {
      clearTimeout(this.currentElectionTimeout);
    }

    this.currentElectionTimeout = setTimeout(
      this.startElection.bind(this),
      this.getRandomTime()
    );
  }

  startLeaderHeartbeat() {
    if (this.currentElectionTimeout) {
      clearTimeout(this.currentElectionTimeout);
      this.currentElectionTimeout = undefined;
    }
    if(this.state == 2){
      const message = formatRaftElectionLeader(this.currentTerm, this.uuid);
      this.cm.sendRaftMessage(message);
    } else {
      clearInterval(this.heartbearInterval )
    }
  }

  getRandomTime = () => Math.random() * 400 + 100;
}

export default RaftManager;
