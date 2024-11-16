import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    init (data) {
        this.connection = data.connection;
    }

    create ()
    {

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cameras.main.setBackgroundColor(0x00ff00);
        var background = this.add.rectangle(0, 0, 10, 10, 0x000000);
        this.roominfo = this.rexUI.add.BBCodeText(0, 0, `Room: ${this.connection.room}`, {color: '#fff'});
        this.direction = this.add.text(0,0, 'direction');
        var viewport = this.rexUI.viewport;
        this.gameinfo = this.rexUI.add.sizer({
            x: viewport.centerX,
            y: 10,
            orientation: 'x',
        })
            .addBackground(background)
            .add(this.roominfo, 0, 'left', {left: 10, right: 10, top: 5, bottom: 5}, true)
            .add(this.direction, 0, 'left', {left: 10, right: 10, top: 5, bottom: 5}, true)
            .layout();
    }

    update (time, delta)
    {
        if (this.cursors.left.isDown)
        {
            this.direction.setText('left');
        }
        else if (this.cursors.right.isDown)
        {
            this.direction.setText('right');
        }
        else if (this.cursors.up.isDown)
        {
            this.direction.setText('up');
        }
        else if (this.cursors.down.isDown)
        {
            this.direction.setText('down');
        }
    }
}
