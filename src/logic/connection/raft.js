import {
  formatRaftElectionRequest,
  formatRaftElectionVote,
  formatRaftElectionLeader,
} from '../raft/message';
import EventEmitter from 'events';

class RaftManager {
  constructor(uuid) {
    this.uuid = uuid;
    this.currentTerm = 0;
    this.gotVotes = 0;
    // 0 - Follower, 1 - candidate, 2 - leader
    this.state = 0;
    this.votesNeeded = 0;
    this.webrtcs = {};
    this.heartbearInterval = undefined;
    this.currentElectionTimeout = undefined;

    this.leaderChangeEvent = new EventEmitter();
  }

  isLeader = () => this.state == 2;

  initRaftConsensus(webrtcs) {
    // maybe get data from localstorage/sessionstorage
    this.currentTerm = 0;
    this.webrtcs = webrtcs;
    this.votesNeeded = Math.ceil((Object.keys(this.webrtcs).length + 1) / 2);
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
    if(this.heartbearInterval){
      clearInterval(this.heartbearInterval)
      this.heartbearInterval = undefined;
    }
    if(this.currentElectionTimeout){
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
    this.votesNeeded = Math.ceil((Object.keys(this.webrtcs).length + 1) / 2);

    for (let uuid in this.webrtcs) {
      const message = formatRaftElectionRequest(this.currentTerm, this.uuid);

      this.webrtcs[uuid].em.emit(
        'send-raft-consensus-channel-message',
        message
      );
    }
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
        this.webrtcs[message.data.requestFrom].em.emit(
          'send-raft-consensus-channel-message',
          voteMessage
        );
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
            this.leaderChangeEvent.emit('leader-change', this.uuid);
            this.state = 2;
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
        this.state = 1;
        this.voteFor = message.data.currentLeader;
        this.leaderChangeEvent.emit('leader-change', message.data.currentLeader);
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

    for (let uuid in this.webrtcs) {
      const message = formatRaftElectionLeader(this.currentTerm, this.uuid);

      this.webrtcs[uuid].em.emit(
        'send-raft-consensus-channel-message',
        message
      );
    }
  }

  getRandomTime = () => Math.random() * 400 + 100;
}

export default RaftManager;
