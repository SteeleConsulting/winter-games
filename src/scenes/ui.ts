import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private livesLabel!: Phaser.GameObjects.Text;
    private scoreLabel!: Phaser.GameObjects.Text;
    private score: number = 0;
    private lives: number = 4;
    private healthBar!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('ui');
    }

    init() {
    }

    preload() {
    }

    create(){
        // create top bar labels and health bar
        this.livesLabel = this.add.text(10, 10, 'Lives: 4', {
            fontSize: '32px', color: 'yellow'
        });
        this.healthBar = this.add.rectangle(350, 25, 200, 20, 0xff0000);
        this.scoreLabel = this.add.text(800, 10, 'Score: 0', {
            fontSize: '32px', color: 'yellow'
        });

        events.on('life-lost', () => {
            if (this.lives > 0) {
                this.lives -= 1;
                this.livesLabel.text = 'Lives: '+ this.lives;
            }
            if (this.lives == 0){
                this.scene.remove('game');
                this.scene.launch('gameover');
            }
        });

        events.on('brick-destroyed', () => {
            this.score += 100;
            this.scoreLabel.text = 'Score: '+ this.score;
        });
    }

    update() {

    }
}