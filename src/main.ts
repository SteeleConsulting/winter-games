import Phaser from "phaser";
import Game from "./scenes/game";
import UI from "./scenes/ui";
import GameOver from "./scenes/gameover"


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
    scene: [Game, UI, GameOver]   // this is the list of scenes to be used in the game, only the first scene is auto launched
};


export default new Phaser.Game(config)
