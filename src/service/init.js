import data from './word-trie-large.json';
import { Trie, TrieNode } from './trie';
// import data from './test_data.json';

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
  console.log(trie.isWordValid('alack'))
  return trie;
}

export const init = () => {
  console.log(createTrie());
}

