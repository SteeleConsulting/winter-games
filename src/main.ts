import Phaser from "phaser";
import Game from "./scenes/game";
import UI from "./scenes/ui";


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1000,
    height: 800,
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: { y: .5 }
        }
    },
    scene: [Game, UI]
};


export default new Phaser.Game(config)