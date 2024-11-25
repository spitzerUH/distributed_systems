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

export function createKOButton(scene) {
  let ko = scene.add.text(0, 0, 'KO!', { fontSize: 64, color: "red" })
    .setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains)
    .setScrollFactor(0, 0)
    .setOrigin(1)
    .setDepth(100);
  ko.setPosition(scene.rexUI.viewport.left + ko.width, scene.rexUI.viewport.bottom);
  return ko;
}
