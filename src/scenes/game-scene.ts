import * as Phaser from 'phaser';
import { ASSET_KEYS, CARD_HEIGHT, CARD_WIDTH, SCENE_KEYS } from './common';

const DEBUG = true;
const SCALE = 1.5;
const CARD_BACK_FRAME = 52;
const SUIT_FRAMES = {
  HEART: 26,
  DIAMOND: 13,
  SPADE: 39,
  CLUB: 0
}

const FOUNDATION_PILE_X_POSITIONS = [360,425, 490, 555]
const FOUNDATION_PILE_Y_POSITION = 5;
const DISCARD_PILE_X_POSITION = 85;
const DISCARD_PILE_Y_POSITION = 5;
const DRAW_PILE_X_POSITION = 5;
const DRAW_PILE_Y_POSITION = 5;
const TABLEAU_PILE_X_POSITION = 40;
const TABLEAU_PILE_Y_POSITION = 92;


export class GameScene extends Phaser.Scene {
  #drawPileCards!: Phaser.GameObjects.Image[];
  #discardPileCards!: Phaser.GameObjects.Image[];
  #foundationPileCards!: Phaser.GameObjects.Image[];
  #tableauContainers!: Phaser.GameObjects.Container[];


  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  public create(): void {
    this.#createDrawPile();
    this.#createDiscardPile();
    this.#createFoundationPiles();
    this.#createTableauPiles();
    this.#createDragEvents();
  }

  #createDrawPile(): void{
    this.#drawCardLocationBox(DRAW_PILE_X_POSITION, DRAW_PILE_Y_POSITION);
    this.#drawPileCards = [];
    for (let i =0; i < 3; i += 1) {
      this.#drawPileCards.push(this.#createCard(DRAW_PILE_X_POSITION + i * 5, DRAW_PILE_Y_POSITION, false))
    }

    const drawZone = this.add.zone(0, 0, CARD_WIDTH * SCALE + 20, CARD_HEIGHT * SCALE + 12).setOrigin(0).setInteractive();
    drawZone.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.#discardPileCards[0].setFrame(this.#discardPileCards[1].frame).setVisible(this.#discardPileCards[1].visible);
      this.#discardPileCards[1].setFrame(CARD_BACK_FRAME).setVisible(true);
    });

    if (DEBUG) {
      this.add.rectangle(drawZone.x, drawZone.y, drawZone.width, drawZone.height, 0xff0000, 0.5).setOrigin(0);
    }
  }

  #drawCardLocationBox(x: number, y: number): void{
    this.add.rectangle(x,y,56, 78).setOrigin(0).setStrokeStyle(2, 0x000000, 0.5);
  }

  #createCard(
    x: number, 
    y: number, 
    draggable: boolean, 
    cardIndex?: number, 
    pileIndex ?: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, ASSET_KEYS.CARDS, CARD_BACK_FRAME).setOrigin(0).setScale(SCALE).setInteractive({
      draggable: draggable, 
    }).setData({
      x,
      y,
      cardIndex,
      pileIndex
    });
  }

  #createDiscardPile(): void{
    this.#drawCardLocationBox(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION);
    this.#discardPileCards = [];
    const bottomCard = this.#createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    const topCard = this.#createCard(DISCARD_PILE_X_POSITION, DISCARD_PILE_Y_POSITION, true).setVisible(false);
    this.#discardPileCards.push(bottomCard);
    this.#discardPileCards.push(topCard);
  }

  #createFoundationPiles(): void{
    this.#foundationPileCards = [];

    FOUNDATION_PILE_X_POSITIONS.forEach((x) => {
      this.#drawCardLocationBox(x, FOUNDATION_PILE_Y_POSITION);
      const card = this.#createCard(x, FOUNDATION_PILE_Y_POSITION, false).setVisible(false);
      this.#foundationPileCards.push(card);
    })
  }

  #createTableauPiles(): void{
    this.#tableauContainers = [];
    for (let i = 0; i < 7; i += 1) {
      const x = TABLEAU_PILE_X_POSITION + i * 85;
      const tableauContainer = this.add.container(x, TABLEAU_PILE_Y_POSITION, []);
      this.#tableauContainers.push(tableauContainer);

      for (let j = 0; j< i + 1; j += 1) {
        const cardGameObject = this.#createCard(0, j * 20, true, j, i);
        tableauContainer.add(cardGameObject)
      }
      
    }
  }

  #createDragEvents(): void{
     this.#createDragStartEventListener();
     this.#createDragEventListener();
     this.#createDragEndEventListener();

  }

  #createDragStartEventListener(): void{
    this.input.on(Phaser.Input.Events.DRAG_START, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      gameObject.setData({x: gameObject.x, y: gameObject.y})
      const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
      if (tableauPileIndex != undefined) {
        this.#tableauContainers[tableauPileIndex].setDepth(2);
      } else {
        gameObject.setDepth(2);
      }
      gameObject.setAlpha(0.8);
    })
  }

  #createDragEventListener(): void{
    this.input.on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, dragX: number, dragY: number) => {
      gameObject.setPosition(dragX, dragY);

      const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
      const cardIndex = gameObject.getData('cardIndex') as number;
      if (tableauPileIndex !== undefined) {
        const numberOfCardsToMove = this.#getNumberOfCardsToMoveAsPartOfStack(tableauPileIndex, cardIndex);
        for (let i = 1; i <= numberOfCardsToMove; i+=1) {
          this.#tableauContainers[tableauPileIndex].getAt<Phaser.GameObjects.Image>(cardIndex + i).setPosition(dragX, dragY + 20 * i)
        }
      }
    })
  }

  #createDragEndEventListener(): void{
    this.input.on(Phaser.Input.Events.DRAG_END, (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      const tableauPileIndex = gameObject.getData('pileIndex') as number | undefined;
      if (tableauPileIndex != undefined) {
        this.#tableauContainers[tableauPileIndex].setDepth(0);
      } else {
        gameObject.setDepth(0);
      }
      gameObject.setAlpha(1);
      gameObject.setPosition(gameObject.getData('x') as number, gameObject.getData('y') as number)

      const cardIndex = gameObject.getData('cardIndex') as number;
      if (tableauPileIndex !== undefined) {
        const numberOfCardsToMove = this.#getNumberOfCardsToMoveAsPartOfStack(tableauPileIndex, cardIndex);
        for (let i = 1; i <= numberOfCardsToMove; i+=1) {
          const cardToMove = this.#tableauContainers[tableauPileIndex].getAt<Phaser.GameObjects.Image>(cardIndex + i);
          cardToMove.setPosition(cardToMove.getData('x') as number, cardToMove.getData('y') as number);
        }
      }
    })
  }

  #getNumberOfCardsToMoveAsPartOfStack(tableauPileIndex: number, cardIndex: number): number {
    if (tableauPileIndex !== undefined) {
      const lastCardIndex = this.#tableauContainers[tableauPileIndex].length - 1;
      return lastCardIndex - cardIndex;
    }
    return 0;
  }
}
