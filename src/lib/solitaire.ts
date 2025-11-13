import { Card } from "./card";
import { CARD_SUIT } from "./common";
import { Deck } from "./deck";
import { FoundationPile } from "./foundation-pile";
import { exhaustiveGuard } from "./utils";

export class Solitaire {
    #deck: Deck;
    #foundationPileSpade: FoundationPile;
    #foundationPileClub: FoundationPile;
    #foundationPileHeart: FoundationPile;
    #foundationPileDiamond: FoundationPile;
    #tableauPiles: Card[][];

    constructor() {
        this.#deck = new Deck();
        this.#foundationPileClub = new FoundationPile(CARD_SUIT.CLUB);
        this.#foundationPileSpade = new FoundationPile(CARD_SUIT.SPADE);
        this.#foundationPileHeart = new FoundationPile(CARD_SUIT.HEART);
        this.#foundationPileDiamond = new FoundationPile(CARD_SUIT.DIAMOND);
        this.#tableauPiles = [[], [], [], [], [], [], []];
    }

    get drawPile(): Card[] {
        return this.#deck.drawPile;
    }

    get discardPile(): Card[] {
        return this.#deck.discardPile;
    }

    get tableauPiles(): Card[][] {
        return this.#tableauPiles;
    }

    get foundationPiles(): FoundationPile[] {
        return [
            this.#foundationPileSpade,
            this.#foundationPileClub,
            this.#foundationPileHeart,
            this.#foundationPileDiamond
        ]
    }

    get wonGame(): boolean {
        return (
            this.#foundationPileClub.value === 13 &&
            this.#foundationPileDiamond.value === 13 &&
            this.#foundationPileHeart.value === 13 && 
            this.#foundationPileSpade.value === 13
        );
    }

    public newGame(): void{
        this.#deck.reset();
        this.#tableauPiles = [[], [], [], [], [], [], []];
        this.#foundationPileClub.reset();
        this.#foundationPileDiamond.reset();
        this.#foundationPileHeart.reset();
        this.#foundationPileSpade.reset();

        for (let i = 0; i < 7; i += 1) {
            for (let j = i; j < 7; j += 1) {
                const card = this.#deck.draw() as Card;
                if (j === i) {
                    card.flip()
                }
                this.#tableauPiles[j].push(card)
            }
        }
    }

    public drawCard(): boolean {
        const card = this.#deck.draw();
        if (card === undefined) {
            return false;
        }
        card.flip();
        this.#deck.discardPile.push(card);
        return true;
    }

    public shuffleDiscardPile(): boolean {
        if (this.#deck.drawPile.length !== 0) {
            return false;
        }
        
        this.#deck.shuffleInDiscardPile();
        return true;
    }

    public playDiscardPileToFoundation(): boolean {
        const card = this.#deck.discardPile[this.#deck.discardPile.length - 1];
        if (card === undefined) {
            return false;
        }

        if (!this.#isValidMoveToAddCardToFoundation(card)) {
            return false;
        } 

        this.#addCardToFoundation(card);
        this.#deck.discardPile.pop();
        return true;
    }

    public playDiscardPileCardToTableau(targetTableauPileIndex: number): boolean {
        const card = this.#deck.discardPile[this.#deck.discardPile.length - 1];
        if (card === undefined) {
            return false;
        }

        const targetTableauPile  = this.#tableauPiles[targetTableauPileIndex];
        if (targetTableauPile === undefined) {
            return false;
        }

        if (!this.#isValidMoveToAddCardToTableau(card, targetTableauPile)) {
            return false;
        }

        this.#tableauPiles[targetTableauPileIndex].push(card);
        this.#deck.discardPile.pop();
        return true;
    }

    public moveTableauCardToFoundation(tableauPileIndex: number): boolean {
        const tableauPile = this.#tableauPiles[tableauPileIndex];
        if (tableauPile === undefined) {
            return false;
        }
        const card = tableauPile[tableauPile.length - 1];
        if (card === undefined) {
            return false;
        }

        if (!this.#isValidMoveToAddCardToFoundation(card)) {
            return false;
        }

        this.#addCardToFoundation(card);
        tableauPile.pop();

        return true;
    }

    public moveTableauCardsToAnotherTableau(initialTableauIndex: number, cardIndex: number, targetTableauPileIndex: number): boolean {
        const initialTableauPile = this.#tableauPiles[initialTableauIndex];
        const targetTableauPile = this.#tableauPiles[targetTableauPileIndex];
        if (initialTableauPile === undefined || targetTableauPile === undefined) {
            return false;
        }

        const card = initialTableauPile[cardIndex];
        if (card === undefined) {
            return false;
        }

        if (!card.isFaceUp) {
            return false;
        }

        if (!this.#isValidMoveToAddCardToTableau(card, targetTableauPile)) {
            return false;
        }

        const cardsToMove = initialTableauPile.splice(cardIndex);
        cardsToMove.forEach((card) => targetTableauPile.push(card))

        return true;
    }

    public flipTopTableauCard(tableauPileIndex: number): boolean {
        const tableauPile = this.#tableauPiles[tableauPileIndex];
        if (tableauPile === undefined) {
            return false;
        }
        const card = tableauPile[tableauPile.length - 1];
        if (card === undefined) {
            return false;
        }

        if (card.isFaceUp) {
            return false;
        }

        card.flip();
        return true;
    }

    #addCardToFoundation(card: Card): void {
        let foundationPile: FoundationPile;
        switch (card.suit) {
            case CARD_SUIT.CLUB:
                foundationPile = this.#foundationPileClub;
                break;
            case CARD_SUIT.SPADE:
                foundationPile = this.#foundationPileSpade;
                break;
            case CARD_SUIT.HEART:
                foundationPile = this.#foundationPileHeart;
                break;
            case CARD_SUIT.DIAMOND:
                foundationPile = this.#foundationPileDiamond;
                break;
            default:
                exhaustiveGuard(card.suit)
        }
        foundationPile.addCard();
    }

    #isValidMoveToAddCardToFoundation(card: Card): boolean {
        let foundationPile: FoundationPile;
        switch (card.suit) {
            case CARD_SUIT.CLUB:
                foundationPile = this.#foundationPileClub;
                break;
            case CARD_SUIT.SPADE:
                foundationPile = this.#foundationPileSpade;
                break;
            case CARD_SUIT.HEART:
                foundationPile = this.#foundationPileHeart;
                break;
            case CARD_SUIT.DIAMOND:
                foundationPile = this.#foundationPileDiamond;
                break;
            default:
                exhaustiveGuard(card.suit);
        }

        return card.value === foundationPile.value + 1;
    }

    #isValidMoveToAddCardToTableau(card: Card, tableauPile: Card[]): boolean {
        if (tableauPile.length === 0) {
            return card.value === 13;   // in the case of an empty tableau
        }

        const lastTableauCard = tableauPile[tableauPile.length - 1];

        if (lastTableauCard.value === 1) {
            return false   // in case of Ace
        }
        if (lastTableauCard.color === card.color) {
            return false;
        }
        if (lastTableauCard.value !== card.value + 1) {
            return false;
        }

        return true;
    }
}