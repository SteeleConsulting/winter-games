import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private gameboy?: Phaser.Physics.Matter.Sprite;

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
        this.load.image('world', 'assets/platformPack_tilesheet.png');
        this.load.image('gem', 'assets/items/platformPack_item007.png');
        this.load.image('fire', 'assets/items/platformPack_item004.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/world.json');
    }

    create(){
        
        const { width, height } = this.scale;  // width and height of the scene

        this.createGameboyAnimations();   //Generate animations
        this.createZombieAnimations();
        
        // Generate world map
        const map = this.make.tilemap({key: 'worldmap'});  
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        this.matter.world.convertTilemapLayer(ground);
        
        // Objects coming from the tile map
        const objectsLayer = map.getObjectLayer('objects');
        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;
            switch(name){
                case 'spawn':
                    this.gameboy = this.matter.add.sprite(x, y, 'gameboy')
                        .play('gameboy-idle');

                    this.matter.add.sprite(x,y,'zombie').play('zombie-walk');

                    this.gameboy.setOnCollide((data: MatterJS.ICollisionPair) => {
                        const bodyA = data.bodyA as MatterJS.BodyType;
                        const bodyB = data.bodyB as MatterJS.BodyType;
                        const gameObjectA = bodyA.gameObject
                        const gameObjectB = bodyB.gameObject

                        if (!gameObjectA || !gameObjectB)
                            return;

                        if (gameObjectA instanceof Phaser.Physics.Matter.TileBody){
                            return;
                        }

                        const spriteA = gameObjectA as Phaser.Physics.Matter.Sprite;
                        const spriteB = gameObjectB as Phaser.Physics.Matter.Sprite;
                        if (spriteA.getData('type') == 'gem' || spriteB.getData('type') == 'gem') {
                            console.log('collided with gem');
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
                    gem.setData('type', 'gem');
                    break;
            }
        });

    }

    update(){
        if (!this.gameboy)
            return;

        if (this.cursors.right.isDown){
            this.gameboy.setVelocityX(5);
        }
        else{
            this.gameboy.setVelocityX(0);
            this.gameboy.play('gameboy-idle', true);

        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);  // Debounced use of space bar
        if (this.cursors.space.isDown && spaceJustPressed){

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