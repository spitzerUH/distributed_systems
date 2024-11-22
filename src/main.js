import { Boot } from '+Boot';
import { Game } from '+Game';
import { GameOver } from '+GameOver';
import { MainMenu } from '+MainMenu';
import { Preloader } from '+Preloader';

import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    dom: {
        createContainer: true
    },
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
        GameOver
    ],
    plugins: {
        scene: [{
            key: 'rexUI',
            plugin: RexUIPlugin,
            mapping: 'rexUI'
        }]
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }

};

export default new Phaser.Game(config);
