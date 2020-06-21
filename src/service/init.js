import data from './word-trie-large-caps.json';
import boardData from './boards/board1.json';
import { Trie, TrieNode } from './trie';
import { Square } from './square';
import { WordProcessor, Direction } from './processor'


function readNode(obj, parentNode) {
  for (const prop in obj.c) {
    const node = new TrieNode();
    readNode(obj.c[prop], node);
    parentNode.c[prop] = node;
  }
  parentNode.t = obj.t;
}

const createTrie = () => {
  const trie = new Trie();
  console.time('read-trie')
  readNode(data, trie.rootNode);
  console.timeEnd('read-trie');
  console.log(trie.isWordValid('ALACK'))
  return trie;
}

const createBoard = () => {
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

export const init = (store) => {
  const trie = createTrie();
  store.board = createBoard();
  const processor = new WordProcessor(store, trie);
  processor.generateWords();
  // processor.wordScore({ x: 8, y: 8 }, Direction.RIGHT);
}

