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
  players.on('join', (pid, data) => {
    let name = data.name || (pid === 'player') ? 'You' : pid;
    let node = players.getElement('#' + pid);
    if (!node) {
      node = scene.add.text(0, 0, name).setName(pid);
      players.add(node, { align: 'left', padding: { left: 10, top: 5, bottom: 5, right: 10 } });
    } else {
      node.text = name;
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
  return players;
}

function resetPosition(scene, element) {
  let x = scene.rexUI.viewport.right - Math.floor(element.width / 2);;
  let y = scene.rexUI.viewport.top + Math.floor(element.height / 2);
  element.setPosition(x, y);
}
