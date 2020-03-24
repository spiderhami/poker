function Poker() {
    const SUIT = ['s', 'h', 'c', 'd'];

    const HAND_CMP_REF = {
        'high-card': { rank: 1, index: [0, 1, 2, 3, 4] },
        'one-pair': { rank: 2, index: [0, 2, 3, 4] },
        'two-pair': { rank: 3, index: [0, 2, 4] },
        'trips': { rank: 4, index: [0, 3, 4] },
        'straight': { rank: 5, index: [0] },
        'flush': { rank: 6, index: [0, 1, 2, 3, 4] },
        'fullhouse': { rank: 7, index: [0, 3] },
        'quads': { rank: 8, index: [4] },
        'straight-flush': { rank: 9, index: [0] }
    }

    let deck = makeADeck();

    /**
     * @var {object}
     * @property {string} strength description of hand strength
     * @property {object[]} cards which five cards deciding the hand strength
     */
    let handThatCount = {
        strength: '',
        cards: []
    };

    
    /**
     * @desc simulate one poker deck
     * @returns {object[]} an array of 52 objects
     * @example
     * Ace of heart -> { 'rank': 1, 'suit': 'h' }
     */
    function makeADeck() {
        let deck = [];
        SUIT.forEach(rep => {
            for (let i = 1; i < 14; i++) {
                deck.push({ 'rank': i, 'suit': rep });
            }
        });
        return deck;
    }

    /**
     * @desc compare function to sort cards by rank in descending order 
     * @param {object} o1 
     * @param {object} o2
     * @returns {number}  return negative if o1 rank is higher, positive if o2 higher
     */
    function byRankDesc(o1, o2) {
        if (o1.rank === 1) {
            return -1;
        } else if (o2.rank === 1) {
            return 1;
        } else {
            return o2.rank - o1.rank;
        }
    }

    /**
     * @desc help highlight where hand strength is figured out
     * @param {string} strength 
     * @param {object[]} fiveCardsArray
     * @returns {boolean} true 
     */
    function strengthFound(strength, fiveCardsArray) {
        handThatCount.strength = strength;
        handThatCount.cards = fiveCardsArray;
        return true;
    }
    
    /**
     * @desc categorize all cards into four suits group, check any group has more than 5 cards
     */
    function isFlush(cards) {
        let group = {}; 
        SUIT.forEach(suit => {
            group[suit] = [];
        });
        cards.forEach(card => {
            group[card.suit].push(card);
        });
        for (let key in group) {
            if (group[key].length >= 5) {
                if (isStraight(group[key])) {
                    // override
                    handThatCount.strength = 'straight-flush';
                } else {
                    strengthFound('flush', group[key].slice(0, 5));
                }
                return true;
            }
        }
        return false;
    }
    
    /**
     * @desc put card that is "rank adjacent" to its previous card into a temporary array,
     *       and finally check that array whether it meet the straight pattern.
     */
    function isStraight(cards) {
        let cardsUsed = [];
        cardsUsed.push(cards[0]);
    
        cards.reduce((prev, curr) => {
            if (curr.rank === prev.rank - 1 || (prev.rank === 1 && curr.rank === 13)) {
                cardsUsed.push(curr);
            } else if (curr.rank !== prev.rank && cardsUsed.length < 5) {
                cardsUsed = [];
                cardsUsed.push(curr);
            } else {
                // curr.rank === prev.rank, just pass
            }
            return curr;
        });
        if (cardsUsed.length >= 5) {
            return strengthFound('straight', cardsUsed.slice(0, 5));
        }
        if (cardsUsed.length === 4 && cardsUsed[0].rank === 5 && cards[0].rank === 1) {
            cardsUsed.push(cards[0]);
            return strengthFound('straight', cardsUsed);
        }
        return false;
    }
    
    /**
     * @desc find whether there is a pair in all given cards, if does marks it
     */
    function findPairPlusPart(cards) {
        let maxRepeat = 1; // most times any card-rank repeats
        let indexMaxEnd = 0; // where the repeat ends, inclusive
        let count = 1;
        cards.reduce((prev, curr, index) => {
            if (curr.rank === prev.rank) {
                count++;
                if (count > maxRepeat) {
                    maxRepeat = count;
                    indexMaxEnd = index;
                }
            } else {
                count = 1;
            }
            return curr;
        });
        if (maxRepeat > 1) {
            return {
                maxRepeat,
                start: indexMaxEnd - maxRepeat + 1,
                end: indexMaxEnd
            }
        }
        return;
    }
    
    /**
     * @desc figure out the exact hand type from all that based on "pair pattern", if any pair exists
     */
    function isPairPlus(cards) {
        let result = findPairPlusPart(cards);
        if (!result) {
            return false;
        }
        let {maxRepeat, start, end} = result;
        let cardsPrimary = cards.slice(start, end + 1); // the 'pair+' part deciding the strength
        let cardsRemaining = cards.slice(0, start).concat(cards.slice(end + 1, cards.length));
    
        // quads
        if (maxRepeat === 4) {
            return strengthFound('quads', cardsPrimary.concat(cardsRemaining[0]));
        }
    
        let pairAnother = findPairPlusPart(cardsRemaining); // result({object}) of any pair in cardsRemaining 
        // fullhouse or trips
        if (maxRepeat === 3) {
            if (pairAnother) {
                let pair = cardsRemaining.slice(pairAnother.start, pairAnother.start + 2); // not using 'result.end' because there could be 2 trips
                return strengthFound('fullhouse', cardsPrimary.concat(pair));
            } else {
                return strengthFound('trips', cardsPrimary.concat(cardsRemaining.slice(0, 2)));
            }
        }
        
        // two-pair or one-pair
        if (maxRepeat === 2) {
            if (pairAnother) {
                let kickerPart = cardsRemaining.slice(0, pairAnother.start).concat(cardsRemaining.slice(pairAnother.end + 1, cardsRemaining.length));
                let pair = cardsRemaining.slice(pairAnother.start, pairAnother.start + 2);
                return strengthFound('two-pair', [...cardsPrimary, ...pair, kickerPart[0]]);
            } else {
                return strengthFound('one-pair', cardsPrimary.concat(cardsRemaining.slice(0, 3)));
            }
        }
        return false;
    }

    function getWinningHand(handsToCompare) {
        let winningHandIndex = [];
        let best = handsToCompare[0];
        handsToCompare.forEach((curr, index) => {
            let result = pk(curr, best);
            if (result < 0) {
                winningHandIndex = [index];
                best = curr;
            }
            if (result === 0) {
                winningHandIndex.push(index);
            }
        });
        return winningHandIndex;
    }

    /**
     * @desc compare which hand is better
     * @param {object} h1 
     * @param {object} h2 
     * @returns {number} return -1 if h1 better, 1 if h2 better, 0 if tie
     */
    function pk(h1, h2) {
        if (HAND_CMP_REF[h1.strength]['rank'] > HAND_CMP_REF[h2.strength]['rank']) {
            return -1;
        } else if (HAND_CMP_REF[h1.strength]['rank'] < HAND_CMP_REF[h2.strength]['rank']) {
            return 1;
        } else {
            let cmp;
            let isDistinct = HAND_CMP_REF[h1.strength]['index'].some(i => {
                if (h1['cards'][i].rank !== h2['cards'][i].rank) {
                    cmp = byRankDesc(h1['cards'][i], h2['cards'][i]);
                    return true;
                }
            });
            return isDistinct ? cmp : 0;
        }
    }



    /* API */

    /**
     * @desc restore deck to non-dealt 52 cards
     */
    this.shuffle = function() {
        deck = makeADeck();
    };

    /**
     * @desc get specific numbers of random cards
     * @param {number} num 
     * @returns {object[]} an array of card objects
     */
    this.deal = function(num = 2) {
        if (typeof num !== 'number') {
            return;
        }

        if (num < 1) {
            return console.log('Deal 1 card at least');
        }

        if (num > deck.length) {
            let plural = deck.length === 1 ? '' : 's';
            return console.log(`Only ${deck.length} card${plural} remaining in the deck`);
        }

        num = Math.floor(num); // in case input number is decimal
        let cards = [];
        while (num-- > 0) {
            let indexRemoved = Math.floor(Math.random() * deck.length);
            let [cardDealt] = deck.splice(indexRemoved, 1);
            cards.push(cardDealt);
        }
        return cards;
    };

    /**
     * @desc figure out hand strength, given one or more arrays of card object
     * @param {...object[]} cards length when concat all arrays should be between 5 - 7
     * @returns {object} return an object telling the strength and which cards count
     * @example
     * 
     * let board = poker.deal(5),
     *     handOne = poker.deal(2);
     * 
     * poker.strength(board, handOne);
     * // { strength: 'quads', 
     *      cards: [{ rank: 2, suit: 's' }, { rank: 2, suit: 'h' }, { rank: 2, suit: 'd' }, { rank: 2, suit: 'c' }, { rank: 10, suit: 's' }] }
     */
    this.strength = function(...cardsArray) {
        let cards = cardsArray.flat().sort(byRankDesc);
        isFlush(cards) || isStraight(cards) || isPairPlus(cards) || strengthFound('high-card', cards.slice(0, 5));
        return {...handThatCount};
    };

    /**
     * @desc analysis which hand(s) is better given certain board
     * @param {object[]} board array of community cards
     * @param  {...object[]} handsAllPlayers - two or more arrays of each player's hand
     * @returns {object[]} return an array of hands' index that win (order according to params)
     */
    this.showdown = function(board, ...handsAllPlayers) {
        // array of comparable 5-card hands
        let handsToCompare = handsAllPlayers.map(hand => this.strength(hand.concat(board)));
        console.log(handsToCompare)
        let winnerArray = getWinningHand(handsToCompare);
        return winnerArray;
    }
}



/* */
let poker = new Poker();
