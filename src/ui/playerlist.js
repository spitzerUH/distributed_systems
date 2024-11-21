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
  players.on('new', (player) => {
    players.add(scene.add.text(0, 0, player), { align: 'left', padding: { left: 10, top: 5, bottom: 5, right: 10 } })
      .layout();
    let x = scene.rexUI.viewport.right - Math.floor(players.width / 2);;
    let y = scene.rexUI.viewport.top + Math.floor(players.height / 2);
    players.setPosition(x, y);
  });
  return players;
}
