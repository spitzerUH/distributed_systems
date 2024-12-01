export function createJoinButton(scene) {
  var joinButton = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, 0x2222ff),
    text: scene.add.text(0, 0, 'Join the game'),
    space: { top: 8, bottom: 8, left: 8, right: 8 }
  })
    .setInteractive()
    .setOrigin(1)
    .layout();

  let obX = scene.rexUI.viewport.left + Math.floor(joinButton.width);
  let obY = scene.rexUI.viewport.bottom;
  joinButton.setPosition(obX, obY);
  return joinButton;
}
