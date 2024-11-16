import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.input.once('pointerdown', () => {

            this.scene.start('GameOver');

        });
    }
}
