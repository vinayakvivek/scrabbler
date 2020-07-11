import { Square }  from './square';

export let state;

export class Letter {
  constructor(value, blank = false) {
    this.value = value;
    this.blank = blank;
  }
}

export const createRack = (letters, numBlanks = 0) => {
  const rack = [];
  [...letters].forEach(l => {
    rack.push(new Letter(l));
  })
  while (numBlanks--) rack.push(new Letter('', true));
  return rack;
}

export const createBoard = (boardData) => {
  const [numRows, numCols] = boardData.size;
  const board = [];
  for (let i = 0; i <= numRows + 1; ++i) {
    const row = []
    for (let j = 0; j <= numCols + 1; ++j) {
      if (i === 0 || i === numRows + 1 || j === 0 || j === numCols + 1) {
        row.push(new Square({x: i, y: j}, null, true))
      } else {
        const s = new Square({x: i, y: j}, boardData.squares[i - 1][j - 1]);
        const tile = boardData.tiles[i - 1][j - 1];
        if (tile !== 'x') {
          s.setTile(tile);
        }
        row.push(s)
      }
    }
    board.push(row);
  }
  for (const pos of boardData.blanks) {
    board[pos[0]][pos[1]].score = 0;
  }
  return board;
}

export const syncState = (store) => {
  const [numRows, numCols] = state.size;
  for (let i = 0; i < numRows; ++i) {
    for (let j = 0; j < numCols; ++j) {
      const value = store.board[i + 1][j + 1].value || 'x';
      state.tiles[i][j] = value;
    }
  }
  let numBlanks = 0;
  let letters = '';
  for (const i in store.rack) {
    if (store.rack[i].blank) numBlanks++;
    else letters += store.rack[i].value;
  }
  state.rack.tiles = letters;
  state.rack.numBlanks = numBlanks;
}

export const resetBoard = (store, boardData) => {
  state = {...boardData};
  store.board = createBoard(boardData);
  store.rack = createRack(boardData.rack.tiles, boardData.rack.numBlanks);
  store.status = 1;
}
