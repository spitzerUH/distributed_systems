import { Scene } from 'phaser';
import { Connection } from "+logic/connection";
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

    this.physics.world.setBounds(0, 0, 2000, 2000);
    const width = this.physics.world.bounds.width;
    const height = this.physics.world.bounds.height;

    const gradientTexture = this.textures.createCanvas(
      "gradientBackground",
      width,
      height
    );
    const ctx = gradientTexture.getSourceImage().getContext("2d");

    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height)
    );

    gradient.addColorStop(0, "#00ff00");
    gradient.addColorStop(1, "#002200");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    gradientTexture.refresh();
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    const conn = new Connection(SIGNALING_SERVER_URL);

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu', { connection: conn });
  }
}
