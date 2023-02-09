import { Sleeping } from "matter";
import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Intro extends Phaser.Scene {
    constructor() {
        super('intro');
    }

    init() {
    }

    preload(){
        this.load.image('logo', 'assets/SteeleLogo.svg')
    }

    create(){
        this.cameras.main.fadeIn(2000);
        var logo = this.add.sprite(560, 410, 'logo');
        this.cameras.main.fadeOut(2000);
        setTimeout(() => {
            this.scene.launch('game');
        }, 3000, this);
    }

    update() {

    }
}