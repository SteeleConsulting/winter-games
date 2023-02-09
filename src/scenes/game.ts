import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {
    private bricks!: Phaser.Physics.Arcade.StaticGroup;
    private paddle!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private ball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;

    constructor() {
        super('game');
    }
    
    init() {
    }

    preload() {
        this.load.atlasXML('assets', 'assets/breakout/sheet/Breakout_Tiles_Medium.png', 'assets/breakout/sheet/Breakout_Tiles_Medium.xml');
    }

    create() {
        // Add UI layout
        setTimeout(() => {
            this.scene.launch('ui');
        }, 850, this);

        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 10x6 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: ['tile-21', 'tile-22', 'tile-23', 'tile-24', 'tile-25'],
            frameQuantity: 15,
            gridAlign: { width: 15, height: 5, cellWidth: 64, cellHeight: 64, x: 112, y: 100 },
        },);
        
        this.ball = this.physics.add.image(400, 520, 'assets', 'tile-58').setCollideWorldBounds(true).setBounce(1).setScale(0.8);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'assets', 'tile-49').setImmovable().setScale(0.8);

        //  Our colliders
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, undefined, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, undefined, this);

        //  Input events
        this.input.on('pointermove', (pointer) => {

            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 1000);

            if (this.ball.getData('onPaddle')) {
                this.ball.x = this.paddle?.x;
            }

        }, this);

        this.input.on('pointerup', (pointer) => {

            if (this.ball.getData('onPaddle')) {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

        }, this);
    }

    update() {
        if (this.ball.y > 600) {
            events.emit('life-lost');
            this.resetBall();
        }
    }

    hitBrick (ball, brick) {
        events.emit('brick-destroyed');
        brick.disableBody(true, true);

        if (this.bricks?.countActive() === 0) {
            this.resetLevel();
        }
    }

    resetBall () {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 510);
        this.ball.setData('onPaddle', true);
    }

    resetLevel () {
        this.resetBall();
        this.bricks.children.each((brick: any) => {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    hitPaddle(ball, paddle) {
        var diff = 0;
        if (ball.x < paddle.x) {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x) {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }
}