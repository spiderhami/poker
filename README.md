# Intro
A helper library for building poker game 

# How to use
Import manually:

```html
<script src="./poker.js">
```

# Example
Deal random two cards for one player

```javascript
let p1 = poker.deal(2);
```

<br>

Show the hand strength given a board

```javascript
let board = poker.deal(5);
let result = poker.strength(p1, board);
// result.strength: "two-pair"
```

<br>

Get the winning hand(s)

```javascript
let p2 = poker.deal(2);
let p3 = poker.deal(2);
poker.showdown(board, p1, p2, p3); // [0, 2]
// p1 and p3 win
```

