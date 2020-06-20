export class TrieNode {

  constructor() {
    this.c = {};
    this.t = false;
  }

  getNode(letter) {
    return this.c[letter];
  }

  addNode(letter) {
    if (!(letter in this.c))
      return this.c[letter] = new TrieNode()
  }

  setTerminal() {
    this.t = true;
  }
}

export class Trie {

  constructor() {
    this.rootNode = new TrieNode();
  }

  addWord(word) {
    const letters = [...word];
    let node = this.rootNode;
    for (const letter of letters) {
      if (!(letter in node.c))
        node.c[letter] = new TrieNode();
      node = node.c[letter];
    }
    node.setTerminal();
  }

  getWordNode(word) {
    const letters = [...word];
    let node = this.rootNode;
    for (const letter of letters) {
      if (!(letter in node.c))
        return undefined;
      node = node.c[letter];
    }
    return node;
  }

  isWordValid(word) {
    const node = this.getWordNode(word);
    return node ? node.t : false;
  }
}