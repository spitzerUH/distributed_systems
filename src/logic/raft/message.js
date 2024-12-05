class Message {
  constructor(type) {
    this._type = type;
  }
  doAction(state, emitter) {
    return new Promise((resolve, reject) => {
      reject('doAction not implemented');
    });
  }
}

function formatRaftElectionRequest(term, uuid) {
  return {
    type: 'raft-election-request',
    data: {
      requestFrom: uuid,
      term: term
    }
  };
}

function formatRaftElectionVote(term, uuid) {
  return {
    type: 'raft-election-vote',
    data: {
      voteFor: uuid,
      term: term
    }
  };
}

function formatRaftElectionLeader(term, uuid) {
  return {
    type: 'raft-election-leader',
    data: {
      currentLeader: uuid,
      term: term
    }
  };
}


export { formatRaftElectionRequest, formatRaftElectionVote, formatRaftElectionLeader };
