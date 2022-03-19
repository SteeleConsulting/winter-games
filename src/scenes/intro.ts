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
        this.load.image('logo', './assets/SteeleLogo.svg')
    }

    create(){
        var logo = this.add.sprite(750, 450, 'logo');
        this.cameras.main.fadeIn(2000);
        this.cameras.main.fadeOut(2000);
        setTimeout(() => {
            this.scene.launch('game');
        }, 4000, this);
    }

    update() {

    }
}