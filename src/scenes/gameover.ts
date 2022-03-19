import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class GameOver extends Phaser.Scene {
    constructor() {
        super('gameover');
    }

    init() {
    }

    preload(){

    }

    create(){
        events.on('gameover', () => {
            this.add.text(600, 480, 'Game Over!', {
                fontSize: '80px', color: 'white'
            });
        });
    }

    update() {

    }
}