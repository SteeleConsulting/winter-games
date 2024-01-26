import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class UI extends Phaser.Scene {

    private gemsLabel!: Phaser.GameObjects.Text;
    private waterLabel!: Phaser.GameObjects.Text;
    private gemsCollected: number = 0;
    private water: number = 1000;
    private waterBar!: Phaser.GameObjects.Rectangle;

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
            fontSize: '32px', color: 'yellow'
        });
        this.waterBar = this.add.rectangle(270,25,200,20,0xff0000);

        this.waterLabel = this.add.text(10, 60, 'Water: 0', {
            fontSize: '32px', color: 'yellow'
        });
        
        events.on('gem-collided', () => {
            this.gemsCollected++;
            this.water += 200;
            this.waterBar.width = this.water / 5;
            this.gemsLabel.text = 'Gems: '+this.gemsCollected;
        })

        events.on('water-shot', () => {
            this.water--;
            this.waterBar.width = this.water/5;
        })
    }

    update() {

    }
}