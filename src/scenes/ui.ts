import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private livesLabel!: Phaser.GameObjects.Text;
    private scoreLabel!: Phaser.GameObjects.Text;
    private score: number = 0;
    private lives: number = 0;

    constructor() {
        super('ui');
    }

    init() {
    }

    preload() {
    }

    create(){
        // create top bar labels and health bar
        this.livesLabel = this.add.text(10, 10, 'Lives:' + this.lives, {
            fontSize: '32px', color: 'yellow'
        });
        this.scoreLabel = this.add.text(800, 10, 'Score: ' + this.score, {
            fontSize: '32px', color: 'yellow'
        });

        events.on('life-lost', () => {
        });

        events.on('brick-destroyed', () => {
        });
    }

    update() {

    }
}