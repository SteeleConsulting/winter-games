import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private gameboy?: Phaser.Physics.Matter.Sprite;
    private weapon?: Phaser.Physics.Matter.Sprite;
    private isTouchingGround:boolean = false;

    constructor() {
        super('game');
    }

    init() {
		this.cursors = this.input.keyboard.createCursorKeys();
        this.scene.launch('ui');
    }

    preload(){
        this.load.atlas('gameboy', 'assets/character.png', 'assets/character.json');
        this.load.atlas('zombie', 'assets/characters/zombie.png', 'assets/characters/zombie.json');
        this.load.atlas('items_atlas', 'assets/vortex/spritesheet_items.png', 'assets/vortex/spritesheet_items.json');
        this.load.image('gem', 'assets/items/platformPack_item017.png');
        this.load.image('fire', 'assets/items/platformPack_item001.png');
        this.load.image('background', 'assets/uncolored_piramids.png');
        this.load.image('world', 'assets/vortex/spritesheet_tiles.png');
        // this.load.image('items', 'assets/vortex/spritesheet_items.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/vortex/hackathon-tilemap.json');
        this.load.spritesheet('items', 'assets/vortex/spritesheet_items.png', {frameWidth: 128, frameHeight: 128,spacing:2});
    }

    create(){
        
        const { width, height } = this.scale;  // width and height of the scene
        this.createGameboyAnimations();
        this.createZombieAnimations();
        // this.game. 
        this.matter.add.image(width * 0.5, height * 0.5, 'background').setFixedRotation().setStatic(true);
        
        const map = this.make.tilemap({key: 'worldmap'});
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        // const items = map.addTilesetImage('platformPack_items', 'items');
        // console.log('items',items);
        
        console.log('tileset',tileset);
        console.log('map',map);

        
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        
        
        this.matter.world.convertTilemapLayer(ground);
        
        const objectsLayer = map.getObjectLayer('objects');

        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;

        var zombie = this.matter.add.sprite(x,y,'zombie').play('zombie-walk');
        zombie.setData('type', 'zombie');
            switch(name){
                case 'spawn':
                    this.gameboy = this.matter.add.sprite(x, y, 'gameboy')
                        .play('gameboy-idle')
                        .setFixedRotation();

                    
                    this.weapon = this.matter.add.sprite(x, y, 'items', 58, {
                        isStatic: true,
                        isSensor: true
                    });
                    this.weapon.angle = 40;
                    this.weapon.scale = 0.5;
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
                            console.log('collided with zombie');
                            // add health damage here
                        }
                        
                    });
                    this.cameras.main.startFollow(this.gameboy);
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
        this.weapon!.x = (this.gameboy!.x + (this.gameboy.flipX ? -35 : 35));
        this.weapon!.y = this.gameboy!. y+10;
        this.weapon!.angle = this.gameboy.flipX ? 220 : 40
        const speed = 5;
        const jumpSpeed = 10;
        const shootSpeed = 15;
        if (this.cursors.left.isDown){
            this.gameboy.setVelocityX(-speed);
            this.gameboy.flipX = true;
            this.gameboy.play('gameboy-walk', true);
        }
        else if (this.cursors.right.isDown){
            this.gameboy.setVelocityX(speed);
            this.gameboy.flipX = false;
            this.gameboy.play('gameboy-walk', true);
        }
        else{
            this.gameboy.setVelocityX(0);
            this.gameboy.play('gameboy-idle', true);

        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (this.cursors.space.isDown && spaceJustPressed && this.isTouchingGround){
            this.gameboy.setVelocityY(-jumpSpeed);
            this.isTouchingGround = false;
        }
        
        const shiftJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.shift);
        if(this.cursors.shift.isDown && shiftJustPressed){
            const projectile = this.matter.add.sprite(this.gameboy.getCenter().x, this.gameboy.getCenter().y+5 , 'items', 10, {
                isSensor: true
            });
            projectile.scale = 0.5;
            projectile.angle = this.gameboy.flipX ? 225 : 45;
            events.emit('water-shot');
            projectile.setIgnoreGravity(false);
            // projectile.setFrictionAir(0.1);
            projectile.setVelocityY(-1);
            projectile.setBounce(0);
            projectile.setVelocityX(this.gameboy.flipX? -shootSpeed : shootSpeed);
            projectile.setData('type', 'fire');
            projectile.setOnCollide((data: MatterJS.ICollisionPair) => {
                const bodyA = data.bodyA as MatterJS.BodyType;
                const bodyB = data.bodyB as MatterJS.BodyType;
                const spriteA = bodyA.gameObject as Phaser.Physics.Matter.Sprite
                const spriteB = bodyB.gameObject as Phaser.Physics.Matter.Sprite

                if (!spriteA || !spriteB || !spriteA.getData || !spriteB.getData)
                    return;
                
                if (spriteA?.getData('type') == 'zombie') {
                    console.log('collided with zombie');
                    projectile.destroy();
                    spriteA.destroy();
                }
                if (spriteB?.getData('type') == 'zombie') {
                    console.log('collided with zombie');
                    projectile.destroy();
                    spriteB.destroy();
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
        })
    }

    private createZombieAnimations(){
        this.anims.create({
            key: 'zombie-idle',
            frames: [{key:'zombie', frame: 'zombie_idle.png'}]
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
        })
        
    }
}