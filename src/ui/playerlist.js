export function createPlayerList(scene, config) {

  const BACKGROUND_COLOR = 0x222222;
  const BORDER_COLOR = 0x000000;

  var background = scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BACKGROUND_COLOR);

  var players = scene.rexUI.add.sizer({
    orientation: 'y'
  })
    .addBackground(background)
    .setScrollFactor(0, 0)
    .layout();
  players.on('join', (player) => {
    let name = player.name || (player.isMyplayer) ? 'You' : player.id;
    let node = players.getElement('#' + player.id);
    if (!node) {
      node = scene.add.text(0, 0, ` ${name}`).setName(player.id);
      players.add(node, { align: 'left', padding: { left: 10, top: 5, bottom: 5, right: 10 } });
    } else {
      node.text = ` ${name}`;
    }
    players.layout();
    resetPosition(scene, players);

  });
  players.on('leave', (pid) => {
    let node = players.getElement('#' + pid);
    if (node) {
      players.remove(node, true);
      players.layout();
      resetPosition(scene, players);
    }
  });

  players.on('leader-change', (leader) => {
    const items = players.getElement('items')
    let leaderNode = players.getElement('#' + leader);
    for(let player in items) {
      let node = items[player];

      const currentName = node.name == 'player' ? 'You' : node.name;
      if(currentName == leader || (currentName == 'You' && !leaderNode))
        node.text = `*${currentName}`;

    }
  })


  return players;
}

function resetPosition(scene, element) {
  let x = scene.rexUI.viewport.right - Math.floor(element.width / 2);;
  let y = scene.rexUI.viewport.top + Math.floor(element.height / 2);
  element.setPosition(x, y);
}
