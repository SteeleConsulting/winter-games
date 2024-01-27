import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private textLabel!: Phaser.GameObjects.Text;
    private points: number = 0;

    constructor() {
        super('ui');
    }

    init() {
        this.points = 0;
    }

    preload(){

    }

    create(){
        this.textLabel = this.add.text(10, 10, 'Text: 0', {
            fontSize: '32px', color: 'yellow'
        });
        
        this.add.rectangle(270,25,200,20,0xff0000);
        
        events.on('powerup-collided', () => {
            this.points++;
            this.textLabel.text = 'Text: ' + this.points;
        })
    }

    update() {

    }
}