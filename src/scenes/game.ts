import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private gameboy?: Phaser.Physics.Matter.Sprite;
    private isTouchingGround:boolean = false;

    private speed = 5;
    private jumpSpeed = 10;
    private shootSpeed = 15;
    private scrollSpeed = 1.5;

    constructor() {
        super('game');
    }

    init() {
		this.cursors = this.input.keyboard.createCursorKeys();
        this.input.addPointer(1);  // pointer used for touch detection
        this.scene.launch('ui');
    }

    preload(){
        this.load.atlas('gameboy', 'assets/character.png', 'assets/character.json');
        this.load.atlas('zombie', 'assets/characters/zombie.png', 'assets/characters/zombie.json');
        this.load.image('world', 'assets/platformPack_tilesheet.png');
        this.load.image('gem', 'assets/items/platformPack_item007.png');
        this.load.image('fire', 'assets/items/platformPack_item004.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/world.json');
    }

    create(){
        
        const { width, height } = this.scale;  // width and height of the scene
        this.createGameboyAnimations();
        this.createZombieAnimations();
        
        const map = this.make.tilemap({key: 'worldmap'});
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        
        this.matter.world.convertTilemapLayer(ground);
        
        const objectsLayer = map.getObjectLayer('objects');
        this.cameras.main.scrollY = 200;

        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;

            var zombie = this.matter.add.sprite(x,y,'zombie').play('zombie-walk');
            zombie.setFixedRotation();
            zombie.setData('type', 'zombie');
            setInterval(() => {if (zombie != null && zombie.active){zombie.setVelocityX(Math.random()>0.5?5:-5);zombie.setVelocityY(Math.random()>0.5?5:-5);}}, 200, zombie); // random movement of enemies
            switch(name){
                case 'spawn':
                    this.gameboy = this.matter.add.sprite(x, y, 'gameboy')
                        .play('gameboy-idle')
                        .setFixedRotation();
                    this.gameboy.setFrictionStatic(0);

                    this.gameboy.setOnCollide((data: MatterJS.ICollisionPair) => {
                        const bodyA = data.bodyA as MatterJS.BodyType;
                        const bodyB = data.bodyB as MatterJS.BodyType;
                        const gameObjectA = bodyA.gameObject
                        const gameObjectB = bodyB.gameObject

                        if (!gameObjectA || !gameObjectB)
                            return;
                        if (gameObjectA instanceof Phaser.Physics.Matter.TileBody){
                            console.log('touching ground')
                            this.isTouchingGround = true;
                            return;
                        }

                        const spriteA = gameObjectA as Phaser.Physics.Matter.Sprite
                        if (spriteA.getData('type') == 'gem') {
                            console.log('collided with gem');
                            events.emit('gem-collided');
                            spriteA.destroy();
                        }
                        const spriteB = gameObjectB as Phaser.Physics.Matter.Sprite
                        if (spriteB.getData('type') == 'gem') {
                            console.log('collided with gem');
                            events.emit('gem-collided'); 
                            spriteB.destroy();
                        }

                        if (spriteB.getData('type') == 'zombie' || spriteA.getData('type') == 'zombie') {
                            
                            events.emit('zombie-collided');
                            this.gameboy?.setVelocityY(-3);
                            setTimeout((gb) => gb.setVelocityX(-15), 10, this.gameboy);
                        }
                        
                    });
                    // this.cameras.main.startFollow(this.gameboy);      // This is the old camera
                    break;
                case 'gem':
                    const gem = this.matter.add.sprite(x, y, 'gem', undefined, {
                        isStatic: true,
                        isSensor: true
                    });
                    gem.setIgnoreGravity(true);
                    gem.setBounce(1);
                    gem.setData('type', 'gem');
                    break;
            }
        });

    }

    update(){
        if (!this.gameboy)
            return;

        this.cameras.main.scrollX += this.scrollSpeed;
        if (this.cursors.left.isDown){
            this.gameboy.setVelocityX(-this.speed);
            this.gameboy.flipX = true;
            this.gameboy.play('gameboy-walk', true);
        }
        else if (this.cursors.right.isDown){
            this.gameboy.setVelocityX(this.speed);
            this.gameboy.flipX = false;
            this.gameboy.play('gameboy-walk', true);
        }
        else{
            this.gameboy.setVelocityX(0);
            this.gameboy.play('gameboy-idle', true);
        }
        if (this.cursors.up.isDown){
            this.gameboy.setVelocityY(-this.speed);
            this.gameboy.play('gameboy-walk', true);
        }
        else if (this.cursors.down.isDown){
            this.gameboy.setVelocityY(this.speed);
            this.gameboy.play('gameboy-walk', true);
        }
        else{
            this.gameboy.setVelocityY(0);
            this.gameboy.play('gameboy-idle', true);
        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (this.cursors.space.isDown && spaceJustPressed && this.isTouchingGround){
            this.gameboy.setVelocityY(-this.jumpSpeed);
            this.isTouchingGround = false;
        }
        
        const shiftJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.shift);
        if(this.cursors.shift.isDown && shiftJustPressed){
            const gem = this.matter.add.sprite(this.gameboy.getCenter().x, this.gameboy.getCenter().y-20, 'fire', undefined, {
                isSensor: true
            });
            gem.setIgnoreGravity(false);
            gem.setFrictionAir(0.0);
            gem.setBounce(1);
            gem.setVelocityX(this.gameboy.flipX? -this.shootSpeed : this.shootSpeed);
            gem.setData('type', 'fire');
            gem.setOnCollide((data: MatterJS.ICollisionPair) => {
                const bodyA = data.bodyA as MatterJS.BodyType;
                const bodyB = data.bodyB as MatterJS.BodyType;
                const spriteA = bodyA.gameObject as Phaser.Physics.Matter.Sprite
                const spriteB = bodyB.gameObject as Phaser.Physics.Matter.Sprite

                if (!spriteA.getData || !spriteB.getData)
                    return;
                
                if (spriteA?.getData('type') == 'zombie') {
                    console.log('collided with zombie');
                    spriteA.play('zombie-hurt');
                    setTimeout((spriteA) => {spriteA.destroy()}, 300, spriteA);
                }
                if (spriteB?.getData('type') == 'zombie') {
                    console.log('collided with zombie');
                    spriteB.play('zombie-hurt');
                    setTimeout((spriteB) => {spriteB.destroy()}, 300, spriteB);
                }
            });
        }

    }

    private createGameboyAnimations(){
        this.anims.create({
            key: 'gameboy-idle',
            frames: [{key:'gameboy', frame: 'platformChar_walk0.png'}]
        });

        this.anims.create({
            key: 'gameboy-walk',
            frameRate: 5,
            frames: this.anims.generateFrameNames('gameboy', {
                start: 0,
                end: 2,
                prefix: 'platformChar_walk',
                suffix: '.png'
            } ),
            repeat:-1
        });
    }

    private createZombieAnimations(){
        this.anims.create({
            key: 'zombie-idle',
            frames: [{key:'zombie', frame: 'zombie_idle.png'}]
        });

        this.anims.create({
            key: 'zombie-hurt',
            frameRate: 10,
            frames: [{key:'zombie', frame: 'zombie_slide.png'}, {key:'zombie', frame: 'zombie_duck.png'}],
            repeat:-1
        });

        this.anims.create({
            key: 'zombie-walk',
            frameRate: 5,
            frames: this.anims.generateFrameNames('zombie', {
                start: 1,
                end: 2,
                prefix: 'zombie_walk',
                suffix: '.png'
            } ),
            repeat:-1
        });
    }
}