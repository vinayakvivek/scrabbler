import data from './word-trie-large-caps.json';
import boardData from './sample_board.json';
import { Trie, TrieNode } from './trie';
import { Square } from './square';


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

export const init = (store) => {
  // console.log(createTrie());
  const board = [];
  for (let rowData of boardData.squares) {
    const row = []
    for (let reward of rowData) {
      row.push(new Square({x: board.length, y: row.length}, reward))
    }
    board.push(row);
  }
  for (let x in boardData.tiles) {
    for (let y in boardData.tiles[x]) {
      const value = boardData.tiles[x][y];
      if (value !== 'x')
        board[x][y].setTile(value);
    }
  }
  for (const pos of boardData.blanks) {
    board[pos[0]][pos[1]].score = 0;
  }
  store.board = board;
}

