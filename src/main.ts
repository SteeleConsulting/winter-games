import Phaser from "phaser";
import Game from "./scenes/game";
import UI from "./scenes/ui";


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: {
                y:0
            }
        }
    },
    scene: [Game, UI]
};


export default new Phaser.Game(config)