import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";    // this is the shared events emitter

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceship?: Phaser.Physics.Matter.Sprite;
    private upgraded: boolean = false;

    private speed = 5;
    private normalSpeed = 5;
    private turboSpeed = 10;
    private shootSpeed = -15;
    private scrollSpeed = -1;

    private laserSound!: Phaser.Sound.BaseSound;
    private explosionSound!:  Phaser.Sound.BaseSound;
    private powerupSound!: Phaser.Sound.BaseSound;
    private backgroundMusic!: Phaser.Sound.BaseSound;

    constructor() {
        super('game');
    }

    init() {
		this.cursors = this.input.keyboard.createCursorKeys();  // setup keyboard input

        // load the other scenes
        this.scene.launch('ui');
        this.scene.launch('gameover');
    }

    preload(){
        this.load.image('star', 'assets/star2.png');
        this.load.image('boss', 'assets/boss.png');
        this.load.atlas('explosion', 'assets/explosion.png', 'assets/explosion.json');

        //this loads a whole tileset, check assets/space-shooter/space-shooter-tileset.json for individual image names
        this.load.atlas('space', 'assets/space-shooter/space-shooter-tileset.png', 'assets/space-shooter/space-shooter-tileset.json');  
        
        // this file has the start locations of all objects in the game
        this.load.tilemapTiledJSON('spacemap', 'assets/space-shooter-tilemap.json');

        this.load.audio('laser', ['assets/sounds/laser.wav']);
        this.load.audio('explosion', ['assets/sounds/explosion.mp3']);
        this.load.audio('powerup', ['assets/sounds/powerup.wav']);
        this.load.audio('pulsar', ['assets/sounds/pulsar-office.mp3']);

    }

    create(){
        const { width, height } = this.scale;  // width and height of the scene

        // Add random stars background
        var bg = this.add.group({ key: 'star', frameQuantity: 3000  });
        var rect = new Phaser.Geom.Rectangle(0, 0, width, 6200);
        Phaser.Actions.RandomRectangle(bg.getChildren(), rect);

        this.createSpaceshipAnimations();
        this.createEnemyAnimations();

        // load tilemap with object locations
        const map = this.make.tilemap({key: 'spacemap'});
        const objectsLayer = map.getObjectLayer('objects');
        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;   // get the coordinates and name of the object from the tile map
            console.log('adding object from tilemap at x:'+x+' y:'+y+' name:'+name);

            // find where the objects are in the tile map and add sprites accordingly by object name
            switch(name){
                case 'spawn':
                    this.cameras.main.scrollY = y-800;   // set camera to spaceship Y coordinates
                    this.spaceship = this.matter.add.sprite(x, y, 'space')
                        .play('spaceship-idle');

                    // configure collision detection
                    this.spaceship.setOnCollide((data: MatterJS.ICollisionPair) => {
                        const spriteA = (data.bodyA as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite
                        const spriteB = (data.bodyB as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite

                        if (!spriteA?.getData || !spriteB?.getData)
                            return;
                        if (spriteA?.getData('type') == 'speedup') {
                            console.log('collided with speedup');
                            this.powerupSound.play();
                        }
                        if (spriteB?.getData('type') == 'speedup') {
                            console.log('collided with speedup');
                            this.powerupSound.play();
                        }
                        
                    });
                    break;
                case 'speedup':
                    const speedup = this.matter.add.sprite(x, y, 'space', 'Power-ups/bolt_gold.png', {
                        isStatic: true,
                        isSensor: true
                    });
                    speedup.setBounce(1);
                    speedup.setData('type', 'speedup');
                    break;
            }
        });

        // Sounds are loaded into memory here
        this.powerupSound = this.sound.add('powerup');
        this.explosionSound = this.sound.add('explosion');
        this.laserSound = this.sound.add('laser'); 
        this.backgroundMusic = this.sound.add('pulsar');

    }

    update(){
        if (!this.spaceship?.active)   // This checks if the spaceship has been created yet
            return;
        
        // move camera up
        //this.cameras.main  //look here at how to adjust the camera view 


        // handle keyboard input
        if (this.cursors.left.isDown){
            this.spaceship.setVelocityX(-this.speed);
            if (this.spaceship.x < 50) this.spaceship.setX(50);    // left boundry
            this.spaceship.flipX = true;
        }
        else if (this.cursors.right.isDown){
            this.spaceship.setVelocityX(this.speed);
            if (this.spaceship.x > 1550) this.spaceship.setX(1550);    // right boundry
            this.spaceship.flipX = false;
        }
        else{
            this.spaceship.setVelocityX(0);
        }

        const shiftJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.shift);   // this is to make sure it only happens once per key press
        if(this.cursors.shift.isDown && shiftJustPressed){
            // do something here
        }
    }

    // create a laser sprite
    createLaser(x: number, y: number, xSpeed: number, ySpeed:number, radians:number = 0){
        var laser = this.matter.add.sprite(x, y, 'space', 'Lasers/laserGreen08.png', { isSensor: true });
        this.upgraded;
        laser.setData('type', 'laser');
        laser.setOnCollide((data: MatterJS.ICollisionPair) => {

            const spriteA = (data.bodyA as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite
            const spriteB = (data.bodyB as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite

            if (!spriteA?.getData || !spriteB?.getData)
                return;
            
            if (spriteA?.getData('type') == 'enemy') {
                console.log('laser collided with enemy');
                spriteB.destroy();
                this.explosionSound.play();
                events.emit('enemy-killed');
            }
            if (spriteB?.getData('type') == 'enemy') {
                console.log('collided with enemy');
                spriteA.destroy();
                this.explosionSound.play();
                events.emit('enemy-killed');
            }
        });
        
        // destroy laser object after 500ms, otherwise lasers stay in memory and slow down the game
        setTimeout((laser) => laser.destroy(), 500, laser);   
    }


    private createSpaceshipAnimations(){
        this.anims.create({
            key: 'spaceship-idle',
            frames: [{key:'space', frame: 'playerShip1_blue.png'}]
        });
        this.anims.create({
            key: 'spaceship-explode',
            frameRate: 30,
            frames: this.anims.generateFrameNames('explosion', {
                start: 1,
                end: 16,
                prefix: 'explosion',
                suffix: '.png'
            } ),
            repeat:1
        });
    }

    private createEnemyAnimations(){
        this.anims.create({
            key: 'enemy-idle',
            frames: [{key:'space', frame: 'Enemies/enemyBlack1.png'}]
        });

        this.anims.create({
            key: 'enemy-explode',
            frameRate: 15,
            frames: this.anims.generateFrameNames('explosion', {
                start: 1,
                end: 16,
                prefix: 'explosion',
                suffix: '.png'
            } ),
            repeat:1
        });
    }
}