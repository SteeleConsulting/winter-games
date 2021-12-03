import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private gemsLabel!: Phaser.GameObjects.Text;
    private gemsCollected: number = 0;

    constructor() {
        super('ui');
    }

    init() {
        this.gemsCollected = 0;
    }

    preload(){

    }

    create(){
        this.gemsLabel = this.add.text(10, 10, 'Gems: 0', {
            fontSize: '32px'
        });
        
        events.on('gem-collided', () => {
            this.gemsCollected++;
            this.gemsLabel.text = 'Gems: '+this.gemsCollected;
        })
    }

    update() {

    }
}