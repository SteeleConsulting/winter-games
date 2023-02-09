import Phaser from "phaser";
import Game from "./scenes/game";
import UI from "./scenes/ui";
import GameOver from "./scenes/gameover"
import Intro from './scenes/intro'


const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1100,
    height: 800,
    physics: {
        default: 'arcade'
    },
    scene: [Intro, Game, UI, GameOver]   // this is the list of scenes to be used in the game, only the first scene is auto launched
};


export default new Phaser.Game(config)