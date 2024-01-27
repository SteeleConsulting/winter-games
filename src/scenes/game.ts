import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private player?: Phaser.Physics.Matter.Sprite;
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
        this.load.image('gem', 'assets/items/platformPack_item017.png');
        this.load.image('fire', 'assets/items/platformPack_item001.png');
        this.load.image('background', 'assets/vortex/uncolored_piramids.png');
        this.load.image('world', 'assets/vortex/spritesheet_tiles.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/vortex/hackathon-tilemap.json');
        this.load.spritesheet('items', 'assets/vortex/spritesheet_items.png', {frameWidth: 128, frameHeight: 128,spacing:2});
        this.load.spritesheet('adventurer', 'assets/vortex/adventurer_tilesheet.png', {frameWidth: 80, frameHeight: 110,spacing:0});
        this.load.spritesheet('soldier', 'assets/vortex/soldier_tilesheet.png', {frameWidth: 80, frameHeight: 110,spacing:0});
        this.load.spritesheet('zombie', 'assets/vortex/zombie_tilesheet.png', {frameWidth: 80, frameHeight: 110,spacing:0});
    }

    create(){
        
        const { width, height } = this.scale;  // width and height of the scene
        this.createGameboyAnimations();
        this.createZombieAnimations();
        
        const map = this.make.tilemap({key: 'worldmap'});
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        
        console.log('tileset',tileset);
        console.log('map',map);

        
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        
        this.matter.world.convertTilemapLayer(ground);
        const objectsLayer = map.getObjectLayer('objects');

        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;

            switch(name){
                case 'spawn':
                    this.player = this.matter.add.sprite(x, y, 'adventurer',0)
                        .play('adventurer-idle')
                        .setFixedRotation();

                    this.player.setOnCollide((data: MatterJS.ICollisionPair) => {
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
                        if (spriteA.getData('type') == 'powerup') {
                            console.log('collided with powerup');
                            events.emit('powerup-collided');
                            spriteA.destroy();
                        }
                        const spriteB = gameObjectB as Phaser.Physics.Matter.Sprite
                        if (spriteB.getData('type') == 'powerup') {
                            console.log('collided with powerup');
                            events.emit('powerup-collided');
                            spriteB.destroy();
                        }

                        if (spriteB.getData('type') == 'zombie' || spriteA.getData('type') == 'zombie') {
                            console.log('collided with zombie');
                            // add health damage here
                        }
                        
                    });
                    this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
                    break;
                case 'powerup':
                    const gem = this.matter.add.sprite(x, y, 'powerup', undefined, {
                        isStatic: true,
                        isSensor: true
                    });
                    gem.setIgnoreGravity(true);
                    gem.setBounce(1);
                    gem.setData('type', 'powerup');
                    break;
                case 'enemy':
                    var zombie = this.matter.add.sprite(x, y, 'zombie').play('zombie-walk');
                    zombie.setData('type', 'zombie');
            }
        });

    }

    update() {
        if (!this.player)
            return;
        const speed = 5;
        const jumpSpeed = 10;
        const shootSpeed = 15;
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.flipX = true;
            this.player.play('adventurer-walk', true);
        }
        else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.flipX = false;
            this.player.play('adventurer-walk', true);
        }
        else {
            this.player.setVelocityX(0);
            this.player.play('adventurer-idle', true);
        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (this.cursors.space.isDown && spaceJustPressed && this.isTouchingGround){
            this.player.setVelocityY(-jumpSpeed);
            this.player.play('adventurer-jump', true);
            this.isTouchingGround = false;
        }
        
        const shiftJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.shift);
        if(this.cursors.shift.isDown){
            this.createProjectile(10, shootSpeed);
        }
    }

    private createProjectile(type:number, speed:number){
        if (!this.player)
            return;
        const projectile = this.matter.add.sprite(this.player.getCenter().x, this.player.getCenter().y + 5, 'items', 10, {
            isSensor: true
        });
        projectile.scale = 0.5;
        projectile.angle = this.player.flipX ? 225 : 45;
        events.emit('water-shot');
        projectile.setIgnoreGravity(false);
        projectile.setVelocityY(-1);
        projectile.setBounce(0);
        projectile.setVelocityX(this.player.flipX ? -speed : speed);
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

    private createGameboyAnimations(){
        this.anims.create({
            key: 'adventurer-idle',
            frames: [{ key:'adventurer', frame: '0'}]
        });

        this.anims.create({
            key: 'adventurer-walk',
            frameRate: 5,
            frames: [{ key: 'adventurer', frame: '0' }, { key: 'adventurer', frame: '9' }, { key: 'adventurer', frame: '10' }],
            repeat:-1
        });

        this.anims.create({
            key: 'adventurer-climb',
            frameRate: 5,
            frames: [{ key: 'adventurer', frame: '5' }, { key: 'adventurer', frame: '6' }],
            repeat: -1
        });

        this.anims.create({
            key: 'adventurer-jump',
            frameRate: 60,
            frames: [{ key: 'adventurer', frame: '1' }],
            repeat: -1
        });

        this.anims.create({
            key: 'adventurer-punch',
            frameRate: 5,
            frames: [{ key: 'adventurer', frame: '14' }],
            repeat: 60
        });
    }

    private createZombieAnimations(){
        this.anims.create({
            key: 'zombie-idle',
            frames: [{key:'zombie', frame: 0}]
        });

        this.anims.create({
            key: 'zombie-walk',
            frameRate: 5,
            frames: [{ key: 'zombie', frame: '0' }, { key: 'zombie', frame: '9' }, { key: 'zombie', frame: '10' }],
            repeat:-1
        })
        
    }
}