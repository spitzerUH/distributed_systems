export function createDebugTextField(scene, connection, observer) {
  var background = scene.add.rectangle(0, 0, 10, 10, 0x000000);

  var roominfo = scene.rexUI.add.BBCodeText(
    0,
    0,
    `Room: ${connection.room}`,
    { color: "#fff", fontSize: "12px" }
  );

  var gameinfo = scene.rexUI.add
    .sizer({
      x: 0,
      y: 0,
      orientation: "x",
    })
    .addBackground(background)
    .add(
      roominfo,
      0,
      "left",
      { left: 10, right: 10, top: 5, bottom: 5 },
      true
    )
    .setScrollFactor(0, 0);
  if (observer) {
    gameinfo.add(
      scene.add.text(0, 0, 'Observer'),
      0,
      'left',
      { left: 10, right: 10, top: 5, bottom: 5 },
      true
    );
  } else {
    var direction = scene.add.text(0, 0, "direction", { fontSize: "12px" });
    gameinfo.on('move', (dirr) => {
      direction.setText(`Direction: ${dirr}`);
      adjust(gameinfo);
    });
    gameinfo.add(
      direction,
      0,
      "left",
      { left: 10, right: 10, top: 5, bottom: 5 },
      true
    );
  }
  adjust(gameinfo);
  gameinfo.setDepth(100);
  return gameinfo
}

function adjust(gameinfo) {
  gameinfo.layout();
  let x = Math.floor(gameinfo.width / 2);
  let y = Math.floor(gameinfo.height / 2);
  gameinfo.setPosition(x, y);
}

