import Phaser from "phaser";
import Game from "./scenes/game";
import UI from "./scenes/ui";


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1000,
    physics: {
        default: 'matter',
        matter: {
            debug: false,
            gravity: {
                y:0
            }
        }
    },
    scene: [Game, UI]   // this is the list of scenes to be used in the game, only the first scene is auto launched
};


export default new Phaser.Game(config)