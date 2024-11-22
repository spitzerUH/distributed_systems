export function createRoomDialog(scene, config) {

  const BORDER_COLOR = 0x000000;
  const BACKGROUND_COLOR = 0x4444ff;
  const BUTTON_COLOR = 0x2222ff;

  var title = 'Room Code';
  var x = config.x;
  var y = config.y;
  var width = undefined;
  var height = undefined;
  var room = '';

  var background = scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BACKGROUND_COLOR);
  var titleField = scene.add.text(0, 0, title);

  var roomField = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, BORDER_COLOR),
    text: scene.rexUI.add.BBCodeText(0, 0, room, { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
    space: { top: 5, bottom: 5, left: 5, right: 5, }
  })
    .setInteractive()
    .on('pointerdown', function () {
      var config = {
        onTextChanged: function (textObject, text) {
          room = text;
          textObject.text = text;
        }
      }
      scene.rexUI.edit(roomField.getElement('text'), config);
    });

  var enterButton = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BUTTON_COLOR),
    text: scene.add.text(0, 0, 'Enter'),
    space: { top: 8, bottom: 8, left: 8, right: 8 }
  })
    .setInteractive()
    .on('pointerdown', function () {
      roomDialog.emit('enter', room);
    });


  var createButton = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BUTTON_COLOR),
    text: scene.add.text(0, 0, 'Create'),
    space: { top: 8, bottom: 8, left: 8, right: 8 }
  })
    .setInteractive()
    .on('pointerdown', function () {
      roomDialog.emit('enter', room);
    });

  var roomDialog = scene.rexUI.add.sizer({
    orientation: 'y',
    x: x,
    y: y,
    width: width,
    height: height,
  })
    .addBackground(background)
    .add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
    .add(roomField, 0, 'left', { bottom: 10, left: 10, right: 10 }, true)
    .add(enterButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
    .add(createButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
    .layout();
  return roomDialog;
};
