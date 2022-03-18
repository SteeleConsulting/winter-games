import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private gemsLabel!: Phaser.GameObjects.Text;
    private scoreLabel!: Phaser.GameObjects.Text;
    private gemsCollected: number = 0;
    private score: number = 0;
    private health: number = 200;
    private healthBar!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('ui');
    }

    init() {
    }

    preload(){

    }

    create(){
        // create top bar labels and health bar
        this.gemsLabel = this.add.text(10, 10, 'Gems: 0', {
            fontSize: '32px', color: 'yellow'
        });
        this.healthBar = this.add.rectangle(270, 25, 200, 20, 0xff0000);
        this.scoreLabel = this.add.text(800, 10, 'Score: 0', {
            fontSize: '32px', color: 'yellow'
        });

        // listen to events coming from the game scene
        events.on('gem-collided', () => {
            this.gemsCollected++;
            this.gemsLabel.text = 'Gems: '+this.gemsCollected;
            if (this.health < 200) this.health += 20;
            this.healthBar.setSize(this.health, 20);
        })

        events.on('enemy-collided', () => {
            if (this.health > 0) this.health -= 10;
            this.healthBar.setSize(this.health, 20);
        });

        events.on('enemy-killed', () => {
            this.score += 100;
            this.scoreLabel.text = 'Score: '+ this.score;
        });
    }

    update() {

    }
}