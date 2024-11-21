export function createRoomDialog(scene, config) {

  const BORDER_COLOR = config.border_color;
  const BACKGROUND_COLOR = config.background_color;
  const BUTTON_COLOR = config.button_color;

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

  var settingsDialog = createSettingsDialog(scene, config);

  var settingsButton = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BUTTON_COLOR),
    text: scene.add.text(0, 0, 'Settings'),
    space: { top: 8, bottom: 8, left: 8, right: 8 }
  })
    .setInteractive();

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
    .add(settingsButton, 0, 'center', { bottom: 10, left: 10, right: 10 }, false)
    .layout();


  settingsDialog.on('open', () => {
    roomDialog.hide();
    settingsDialog.show();
  });
  settingsDialog.on('close', () => {
    settingsDialog.hide();
    roomDialog.show();
  });
  settingsButton.on('pointerdown', function () {
    settingsDialog.emit('open');
  });
  return roomDialog;
};

function createSettingsDialog(scene, config) {
  const BACKGROUND_COLOR = config.background_color;
  const BORDER_COLOR = config.border_color;
  const BUTTON_COLOR = config.button_color;
  var x = config.x;
  var y = config.y;
  var width = undefined;
  var height = undefined;

  var background = scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BACKGROUND_COLOR);

  var titleField = scene.add.text(0, 0, 'Settings');

  var playerName = JSON.parse(localStorage.getItem('player-name'));
  var nameField = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10).setStrokeStyle(2, BORDER_COLOR),
    text: scene.rexUI.add.BBCodeText(0, 0, playerName, { fixedWidth: 150, fixedHeight: 36, valign: 'center' }),
    space: { top: 5, bottom: 5, left: 5, right: 5, }
  })
    .setInteractive()
    .on('pointerdown', function () {
      var config = {
        onTextChanged: function (textObject, text) {
          playerName = text;
          textObject.text = text;
        }
      }
      scene.rexUI.edit(nameField.getElement('text'), config);
    });

  var playerColor = undefined
  try {
    playerColor = JSON.parse(localStorage.getItem('player-color'));
  } catch (e) {
    playerColor = 0x000000;
  }
  var playerColorPicker = scene.rexUI.add.colorInput({
    height: 60,
    inputText: false,
    space: { left: 10, right: 10, top: 10, bottom: 10, item: 8 },

    colorPicker: {
      background: {
        color: BACKGROUND_COLOR,
        strokeColor: BORDER_COLOR
      }
    },
    colorComponents: {
      space: { item: 8 }
    },

    valuechangeCallback: function (newValue, oldValue, colorInput) {
      playerColor = newValue;
    },

    value: playerColor
  });

  var closeButton = scene.rexUI.add.label({
    orientation: 'x',
    background: scene.rexUI.add.roundRectangle(0, 0, 10, 10, 10, BUTTON_COLOR),
    text: scene.add.text(0, 0, 'Close'),
    space: { top: 8, bottom: 8, left: 8, right: 8 }
  })
    .setInteractive()

  var playerFields = scene.rexUI.add.sizer({
    orientation: 'x',
    x: 0,
    y: 0
  })
    .add(playerColorPicker, 0, 'left', {}, true)
    .add(nameField, 0, 'left', {}, true)
    .layout();

  var settingsDialog = scene.rexUI.add.sizer({
    orientation: 'y',
    x: x,
    y: y,
    width: width,
    height: height,
  })
    .addBackground(background)
    .add(titleField, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
    .add(playerFields, 0, 'left', { top: 10, bottom: 10, left: 10, right: 10 }, true)
    .add(closeButton, 0, 'center', { top: 10, bottom: 10, left: 10, right: 10 }, false)
    .layout()
    .hide();

  closeButton.on('pointerdown', function () {
    localStorage.setItem('player-name', JSON.stringify(playerName));
    localStorage.setItem('player-color', JSON.stringify(playerColor));
    settingsDialog.emit('close');
  });

  return settingsDialog;
}
