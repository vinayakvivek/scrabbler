// import data from './word-trie-caps.json';
import { Trie, TrieNode } from './trie';

function readNode(obj, parentNode) {
  for (const prop in obj.c) {
    const node = new TrieNode();
    readNode(obj.c[prop], node);
    parentNode.c[prop] = node;
  }
  parentNode.t = obj.t;
}

export const createTrie = () => {
  const trie = new Trie();
  console.time('read-trie')
  // readNode(data, trie.rootNode);
  console.timeEnd('read-trie');
  console.log(trie.isWordValid('ALACK'))
  return trie;
}

