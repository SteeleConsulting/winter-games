import Phaser from "phaser";
import { sharedInstance as events } from "../helpers/eventCenter";

export default class Game extends Phaser.Scene {

	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private character?: Phaser.Physics.Matter.Sprite;
    private isTouchingGround:boolean = false;

    constructor() {
        super('game');
    }

    init() {
		this.cursors = this.input.keyboard.createCursorKeys();
        this.scene.launch('ui');
    }

    preload(){
        this.load.atlas('character', 'assets/character.png', 'assets/character.json');
        this.load.image('world', 'assets/platformPack_tilesheet.png');
        this.load.image('gem', 'assets/items/platformPack_item007.png');
        this.load.tilemapTiledJSON('worldmap', 'assets/world.json');

    }

    create(){
        
        const { width, height } = this.scale;  // width and height of the scene
        this.createCharacterAnimations();
        
        const map = this.make.tilemap({key: 'worldmap'});
        const tileset = map.addTilesetImage('platformPack_tilesheet', 'world');
        
        const ground = map.createLayer('ground', tileset);
        ground.setCollisionByProperty({collides: true});
        
        this.matter.world.convertTilemapLayer(ground);
        
        const objectsLayer = map.getObjectLayer('objects');

        objectsLayer.objects.forEach(obj => {
            const {x=0, y=0, name} = obj;
            switch(name){
                case 'spawn':
                    this.character = this.matter.add.sprite(x, y, 'character')
                        .play('character-idle')
                        .setFixedRotation();


                    this.character.setOnCollide((data: MatterJS.ICollisionPair) => {
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

                        const sprite = gameObjectB as Phaser.Physics.Matter.Sprite
                        if (sprite.getData('type') == 'star') {
                            console.log('collided with star');
                            events.emit('gem-collided');
                            sprite.destroy();
                        }
                        
                    });
                    this.cameras.main.startFollow(this.character);
                    break;
                case 'gem':
                    const gem = this.matter.add.sprite(x, y, 'gem', undefined, {
                        isStatic: true,
                        isSensor: true
                    });
                    gem.setIgnoreGravity(true);
                    gem.setBounce(1);
                    gem.setData('type', 'star');
                    break;
            }
        });

    }

    update(){
        if (!this.character)
            return;
        const speed = 5;
        const jump = 10;
        if (this.cursors.left.isDown){
            this.character.setVelocityX(-speed);
            this.character.flipX = true;
            this.character.play('character-walk', true);
        }
        else if (this.cursors.right.isDown){
            this.character.setVelocityX(speed);
            this.character.flipX = false;
            this.character.play('character-walk', true);
        }
        else{
            this.character.setVelocityX(0);
            this.character.play('character-idle', true);

        }
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (this.cursors.space.isDown && spaceJustPressed && this.isTouchingGround){
            this.character.setVelocityY(-jump);
            this.isTouchingGround = false;
        }

    }

    private createCharacterAnimations(){
        this.anims.create({
            key: 'character-idle',
            frames: [{key:'character', frame: 'platformChar_walk0.png'}]
        });

        this.anims.create({
            key: 'character-walk',
            frameRate: 5,
            frames: this.anims.generateFrameNames('character', {
                start: 0,
                end: 2,
                prefix: 'platformChar_walk',
                suffix: '.png'
            } ),
            repeat:-1
        })
    }
}