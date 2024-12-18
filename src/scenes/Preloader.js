import { Scene } from 'phaser';
import ConnectionManager from '+logic/connection/manager';
import Coordinator from '+logic/game/coordinator';
import { createGradient } from '+textures/gradient';
const SIGNALING_SERVER_URL = process.env.SIGNALING_SERVER_URL;


export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress) => {

      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + (460 * progress);

    });
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('assets');
    createGradient(this, "gradientBackground", 100, 100, "#00ff00", "#002200");
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    const conn = new ConnectionManager(SIGNALING_SERVER_URL);
    conn.bindEvents();
    conn.connect();
    const coordinator = new Coordinator(conn);

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu', { coordinator: coordinator });
  }
}
