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
        this.dirr = undefined;
        this.dirrSending = false;

        this.player = this.add.circle(viewport.centerX, viewport.centerY, 10, 0x000000);
        this.physics.add.existing(this.player);

        this.players = {};

        this.connection.openDataChannel = (playerid) => {
            let otherplayer = this.add.circle(viewport.centerX, viewport.centerY, 10, 0x000000);
            this.physics.add.existing(otherplayer);
            this.players[playerid] = otherplayer;
        }

        this.connection.receivedMessage = (playerid, message) => {
            console.log(message);
            let command = JSON.parse(message);
            switch (command.moving) {
                case 'left':
                    this.players[playerid].body.setVelocity(-100,0);
                    break;
                case 'right':
                    this.players[playerid].body.setVelocity(100,0);
                    break;
                case 'up':
                    this.players[playerid].body.setVelocity(0,-100);
                    break;
                case 'down':
                    this.players[playerid].body.setVelocity(0,100);
                    break;
            }
        };
    }

    update (time, delta)
    {
        var curDirr = undefined;
        if (this.cursors.left.isDown)
        {
            this.direction.setText('left');
            curDirr = 'left';
            this.player.body.setVelocity(-100,0);
        }
        else if (this.cursors.right.isDown)
        {
            this.direction.setText('right');
            curDirr = 'right';
            this.player.body.setVelocity(100,0);
        }
        else if (this.cursors.up.isDown)
        {
            this.direction.setText('up');
            curDirr = 'up';
            this.player.body.setVelocity(0,-100);
        }
        else if (this.cursors.down.isDown)
        {
            this.direction.setText('down');
            curDirr = 'down';
            this.player.body.setVelocity(0,100);
        }
        if (curDirr && curDirr != this.dirr) {
            this.sendMovement(curDirr);
        }
    }

    sendMovement(movement) {
        if (!this.dirrSending) {
            this.dirrSending = true;
            this.connection.sendMessage(`{"moving": "${movement}"}`).then(() => {
                this.dirr = movement;
                this.dirrSending = false;
            });
        }
    }
}
