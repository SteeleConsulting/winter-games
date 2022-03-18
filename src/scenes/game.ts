import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";    // this is the shared events emitter

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceship?: Phaser.Physics.Matter.Sprite;
    private isTouchingGround: boolean = false;
    private upgraded: boolean = false;

    private speed = 5;
    private normalSpeed = 5;
    private turboSpeed = 10;
    private shootSpeed = -15;
    private scrollSpeed = -1;

    private laser!: Phaser.Sound.BaseSound;
    private explosion!:  Phaser.Sound.BaseSound;
    private powerup!: Phaser.Sound.BaseSound;

    constructor() {
        super('game');
    }

    init() {
		this.cursors = this.input.keyboard.createCursorKeys();  // setup keyboard input
        this.scene.launch('ui');   // add the UI scene
    }

    preload(){
        this.load.image('star', 'assets/star2.png');
        this.load.atlas('explosion', 'assets/explosion.png', 'assets/explosion.json');

        //this loads a whole tileset, check assets/space-shooter/space-shooter-tileset.json for individual image names
        this.load.atlas('space', 'assets/space-shooter/space-shooter-tileset.png', 'assets/space-shooter/space-shooter-tileset.json');  

        this.load.image('world', 'assets/platformPack_tilesheet.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/world.json');

        this.load.audio('laser', ['assets/sounds/laser.wav']);
        this.load.audio('explosion', ['assets/sounds/explosion.mp3']);
        this.load.audio('powerup', ['assets/sounds/powerup.wav']);

    }

    create(){
        const { width, height } = this.scale;  // width and height of the scene

        // Add random stars background
        var bg = this.add.group({ key: 'star', frameQuantity: 300  });
        var rect = new Phaser.Geom.Rectangle(0, -4 * height, width, 5 * height);
        Phaser.Actions.RandomRectangle(bg.getChildren(), rect);

        this.createSpaceshipAnimations();
        this.createEnemyAnimations();

        
        const map = this.make.tilemap({key: 'worldmap'});
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        
        this.matter.world.convertTilemapLayer(ground);
        
        const objectsLayer = map.getObjectLayer('objects');
        this.cameras.main.scrollY = 200;

        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;   // get the coordinates and name of the object from the tile map

            // add an enemy at every object in the tile map
            var enemy = this.matter.add.sprite(x,y,'space').play('enemy-idle');
            enemy.setFixedRotation();
            enemy.setData('type', 'enemy');
            setInterval(() => {if (enemy != null && enemy.active){enemy.setVelocityX(Math.random()>0.5?5:-5);enemy.setVelocityY(Math.random()>0.5?5:-5);}}, 200, enemy); // random movement of enemies

            // find where the spawn and gem objects are in the tile map and add sprites accordingly 
            switch(name){
                case 'spawn':
                    this.spaceship = this.matter.add.sprite(x, y, 'space')
                        .play('spaceship-idle')
                        .setFixedRotation();
                    this.spaceship.setFrictionStatic(0);

                    this.spaceship.setOnCollide((data: MatterJS.ICollisionPair) => {
                        const spriteA = (data.bodyA as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite
                        const spriteB = (data.bodyB as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite

                        if (!spriteA?.getData || !spriteB?.getData)
                            return;
                        if ((data.bodyA as MatterJS.BodyType).gameObject instanceof Phaser.Physics.Matter.TileBody){
                            console.log('touching tile');
                            this.isTouchingGround = true;
                            this.scrollSpeed = 0;
                            this.spaceship?.play('spaceship-explode');
                            return;
                        }
                        if (spriteA?.getData('type') == 'gem') {
                            console.log('collided with gem');
                            events.emit('gem-collided');
                            spriteA.destroy();
                            this.powerup.play();
                            this.upgraded = true;
                        }
                        if (spriteB?.getData('type') == 'gem') {
                            console.log('collided with gem');
                            events.emit('gem-collided'); 
                            spriteB.destroy();
                            this.powerup.play();
                            this.upgraded = true;
                        }
                        if (spriteB?.getData('type') == 'enemy' || spriteA?.getData('type') == 'enemy') {
                            console.log('taking damage');
                            events.emit('enemy-collided');
                            this.spaceship?.setVelocityY(-3);
                            setTimeout((spaceship) => spaceship.setVelocityX(-15), 10, this.spaceship);
                        }
                        
                    });
                    break;
                case 'gem':
                    const gem = this.matter.add.sprite(x, y, 'space', 'Power-ups/powerupBlue_bolt.png', {
                        isStatic: true,
                        isSensor: true
                    });
                    gem.setIgnoreGravity(true);
                    gem.setBounce(1);
                    gem.setData('type', 'gem');
                    break;
            }
        });

        // Sounds are loaded into memory here
        this.powerup = this.sound.add('powerup');
        this.explosion = this.sound.add('explosion');
        this.laser = this.sound.add('laser'); 

        this.cameras.main.fadeIn(2000);   // just a nice intro effect
    }

    update(){
        if (!this.spaceship)   // This checks if the spaceship has been created yet
            return;

        // move camera up
        this.cameras.main.scrollY += this.scrollSpeed;

        // bottom boundry 
        var currentYBoundry = this.cameras.main.getWorldPoint(0,950).y
        if (currentYBoundry < this.spaceship.y) {
            this.spaceship.y = currentYBoundry;
        }

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
        if (this.cursors.up.isDown){
            this.spaceship.setVelocityY(-this.speed);
        }
        else if (this.cursors.down.isDown){
            this.spaceship.setVelocityY(this.speed);
        }
        else{
            this.spaceship.setVelocityY(0);
        }

        // speed up map scroll speed
        if (this.cursors.space.isDown){
            this.scrollSpeed = -3;
        }
        else {
            this.scrollSpeed = -1;
        }
        
        // fire lasers
        const shiftJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.shift);   // this is to make sure one laser gets fire with every key press
        if(this.cursors.shift.isDown && shiftJustPressed){

            // single laser
            this.createLaser(this.spaceship.getCenter().x, this.spaceship.getCenter().y-20, 0, this.shootSpeed);

            // dual laser
            // this.createLaser(this.spaceship.getCenter().x-10, this.spaceship.getCenter().y-20, 0, this.shootSpeed);
            // this.createLaser(this.spaceship.getCenter().x+10, this.spaceship.getCenter().y-20, 0, this.shootSpeed);
            
            // tri-laser
            if (this.upgraded){ 
                this.createLaser(this.spaceship.getCenter().x, this.spaceship.getCenter().y-20, this.shootSpeed/2, this.shootSpeed/2, -.78);
                this.createLaser(this.spaceship.getCenter().x, this.spaceship.getCenter().y-20, -this.shootSpeed/2, this.shootSpeed/2, .78);
            }
        }
    }

    createLaser(x: number, y: number, xSpeed: number, ySpeed:number, radians:number = 0){
        const laser = this.matter.add.sprite(x, y, 'space', 'Lasers/laserBlue01.png', {
            isSensor: true
        });
        this.laser.play();
        laser.setFrictionAir(0.0);
        laser.setVelocityY(ySpeed);
        laser.setVelocityX(xSpeed);
        laser.setRotation(radians);
        laser.setData('type', 'laser');
        laser.setOnCollide((data: MatterJS.ICollisionPair) => {

            const spriteA = (data.bodyA as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite
            const spriteB = (data.bodyB as MatterJS.BodyType).gameObject as Phaser.Physics.Matter.Sprite

            if (!spriteA?.getData || !spriteB?.getData)
                return;
            
            if (spriteA?.getData('type') == 'enemy') {
                console.log('collided with enemy');
                spriteA.play('enemy-explode');
                spriteB.destroy();
                setTimeout((spriteA) => {spriteA.destroy()}, 300, spriteA);
                this.explosion.play();
                this.cameras.main.flash(250);
                events.emit('enemy-killed');
            }
            if (spriteB?.getData('type') == 'enemy') {
                console.log('collided with enemy');
                spriteB.play('enemy-explode');
                spriteA.destroy();
                setTimeout((spriteB) => {spriteB.destroy()}, 300, spriteB);
                this.explosion.play();
                this.cameras.main.flash(250);
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
            repeat:-1
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