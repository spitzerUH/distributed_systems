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
        this.cameras.main.setBackgroundColor(0x00ff00);
        this.rexUI.add.BBCodeText(0, 0, `Room: ${this.connection.room}`, {color: '#000'});
    }
}
