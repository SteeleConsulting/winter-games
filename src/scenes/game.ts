import Phaser, { GameObjects } from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {
    private bricks!: Phaser.Physics.Arcade.StaticGroup;
    private paddle!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private ball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    private cursor:any;
    private paddleSpeed: number = 200;
    private explosionSound!: Phaser.Sound.BaseSound;

    constructor() {
        super('game');
    }
    
    init() {
        // add keyboard bindings to up, down, left, right, space, shift
        this.cursor = this.input.keyboard.createCursorKeys();
    }

    preload() {
        // load assets
        this.load.audio('music', 'assets/sounds/pulsar-office.mp3');
        this.load.audio('explosion', 'assets/sounds/explosion.mp3');
        this.load.atlasXML('tiles', 'assets/breakout/sheet/Breakout_Tiles_Medium.png', 'assets/breakout/sheet/Breakout_Tiles_Medium.xml');
        this.load.atlas('explosion', 'assets/explosion.png', 'assets/explosion.json');
    }

    create() {
        this.createExplosionAnimation();

        // set up sounds
        this.explosionSound = this.game.sound.add('explosion');

        // Add UI layout
        setTimeout(() => {
            this.scene.launch('ui');
        }, 850, this);

        //  Enable world bounds, but disable the floor
        this.physics.world.setBoundsCollision(true, true, true, false);

        //  Create the bricks in a 10x2 grid
        this.bricks = this.physics.add.staticGroup({
            key: 'tiles', frame: ['tile-21', 'tile-22'],
            frameQuantity: 15,
            gridAlign: { width: 15, height: 2, cellWidth: 64, cellHeight: 64, x: 100, y: 100 },
        });
        
        this.ball = this.physics.add.image(400, 520, 'tiles', 'tile-58').setCollideWorldBounds(true).setBounce(1).setScale(0.8);
        this.ball.setData('onPaddle', true);

        this.paddle = this.physics.add.image(400, 550, 'tiles', 'tile-49').setImmovable().setScale(0.8);

        //  Colliders
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, undefined, this);
        
        //  Input events
        this.input.on('pointermove', (pointer) => {
            console.log(pointer.position.x);
            if (this.ball.getData('onPaddle')) {
            }
        }, this);

        this.input.on('pointerup', (pointer) => {
        }, this);
    }

    update() {
        // ball is past below the paddle
        if (this.ball.y > 600) {
            events.emit('life-lost');
        }

        // handle keyboard input
        if (this.cursor.right.isDown){
            this.paddle.setVelocityX(this.paddleSpeed);
        }
        else if (this.cursor.space.isDown){
            this.releaseBall();
        }
        else {
            this.paddle.setVelocityX(0);
        }
    }

    hitBrick (ball, brick) {
        if (this.bricks?.countActive() === 0) {
            console.log('all bricks cleared');
        }
    }

    resetBall () {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 510);
        this.ball.setData('onPaddle', true);
    }

    releaseBall () {
        this.ball.setVelocity(-75, -300);
        this.ball.setData('onPaddle', false);
    }

    resetLevel () {
        this.resetBall();
        this.bricks.children.each((brick: any) => {
            brick.enableBody(false, 0, 0, true, true);
        });
    }

    hitPaddle(ball, paddle) {
        console.log('collision with paddle');
    }

    // add explosion animation to the game
    createExplosionAnimation(){
        this.anims.create({
            key: 'enemy-explode',
            frameRate: 15,
            frames: this.anims.generateFrameNames('explosion', {
                start: 1,
                end: 16,
                prefix: 'explosion',
                suffix: '.png'
            } ),
            repeat:0
        });
    }
}