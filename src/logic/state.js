class GameState {
  constructor() {
    this.players = {};
  }
  addPlayer(player) {
    this.players[player.id] = player;
  }
  removePlayer(player) {
    return new Promise((resolve) => {
      if (player) {
        this.players[player.id].resetObject();
        delete this.players[player.id];
        resolve();
      } else {
        reject('Player not found');
      }
    });
  }
}
