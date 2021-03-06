import { LETTER_SCORES } from './square';
import { Letter, Direction, Reward, nextPos } from './utils';
import { wordTrie } from './create-trie';

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function reverse(s) {
  return [...s].reverse().join('');
}

export class WordProcessor {

  constructor(store) {
    this.store = store;
    this.setFocus = store.setFocus;
    this.trie = wordTrie;
  }

  getFromRack(l) {
    return this.store.rack.find(x => x.value === l) || this.store.rack.find(x => x.blank);
  }

  insertInRack(letter) {
    this.store.rack.push(letter);
  }

  removeFromRack(letter) {
    if (letter.blank) {
      this.store.rack.splice(this.store.rack.findIndex(x => x.blank), 1);
    } else {
      this.store.rack.splice(this.store.rack.findIndex(x => !x.blank && x.value === letter.value), 1);
    }
  }

  async focusAndWait(pos, time = 500) {
    this.setFocus(pos);
    await timer(time);
  }

  square(pos) {
    return this.store.board[pos.x][pos.y];
  }

  placeWord(word, startPos, direction) {
    let sq = this.square(startPos);
    for (const letter of word) {
      if (!sq.value) {
        if (letter.blank) {
          sq.setTile(letter.value, 0);
        } else {
          sq.setTile(letter.value);
        }
      }
      sq = this.square(nextPos(sq.pos, direction))
      if (sq.isBorder) break;
    }
  }

  focusWord(word, startPos, direction) {
    let sq = this.square(startPos);
    for (const letter of word) {
      if (!sq.value) {
        if (letter.blank) {
          sq.setTempTile(letter.value, 0);
        } else {
          sq.setTempTile(letter.value);
        }
      }
      sq.focus = true;
      sq = this.square(nextPos(sq.pos, direction))
    }
  }

  partialWordUtil(pos, direction) {
    let score = 0;
    let word = ''
    let currSq = this.square(nextPos(pos, direction));
    while (currSq.value) {
      score += currSq.score;
      word += currSq.value;
      currSq = this.square(nextPos(currSq.pos, direction));
    }
    return { score, word };
  }

  removeAllTempData() {
    const b = this.store.board;
    const [nr, nc] = [b.length, b[0].length];
    for (let x = 1; x < nr - 1; ++x) {
      for (let y = 1; y < nc - 1; ++y) {
        const sq = b[x][y];
        sq.removeTempTile();
        sq.focus = false;
      }
    }
  }

  removeTempData(word, startPos, direction) {
    let sq = this.square(startPos);
    let n = word.length;
    while (!sq.isBorder && n--) {
      sq.removeTempTile();
      sq.focus = false;
      sq = this.square(nextPos(sq.pos, direction))
    }
  }

  tempWordScore(word, startPos, direction) {
    let sq = this.square(startPos);
    let [score, extraScore, dw, tw] = [0, 0, 0, 0];
    for (const letter of word) {
      if (sq.value) {
        score += sq.score;
      } else {
        const letterScore = letter.blank ? 0 : LETTER_SCORES[letter.value];
        score += letterScore;
        switch (sq.reward) {
          case Reward.TW:
            tw++; break;
          case Reward.TL:
            score += 2 * letterScore; break;
          case Reward.DW:
            dw++; break;
          case Reward.DL:
            score += letterScore; break;
          default:
        }
        if (sq.anchorData) {
          let data = direction === Direction.RIGHT || direction === Direction.LEFT
                      ? sq.anchorData.topToBottom : sq.anchorData.leftToRight;
          const acrossWord = data.p1 + letter.value + data.p2;
          if (acrossWord.length > 1) {
            switch (sq.reward) {
              case Reward.TW:
                extraScore += 3 * (data.score + letterScore); break;
              case Reward.TL:
                extraScore += (data.score + 3 * letterScore); break;
              case Reward.DW:
                extraScore += 2 * (data.score + letterScore); break;
              case Reward.DL:
                extraScore += (data.score + 2 * letterScore); break;
              default:
                extraScore += (data.score + letterScore);
            }
          }
        }
      }
      sq = this.square(nextPos(sq.pos, direction))
    }
    if (dw) {
      score *= 2 * dw;
    }
    if (tw) {
      score *= 3 * tw;
    }
    return score + extraScore;
  }

  checkPositionValidity(pos, direction) {
    if (direction === Direction.RIGHT) {
      return pos.y > this.anchor.y;
    } else {
      return pos.x > this.anchor.x;
    }
  }

  extendRight(partialWord, node, pos, direction) {
    const sq = this.square(pos);
    if (sq.isBorder) return;
    if (!sq.value) {
      if (node.t && this.checkPositionValidity(pos, direction) && partialWord.length) {
        let startPos;
        if (direction === Direction.RIGHT)
          startPos = { x: pos.x, y: pos.y - partialWord.length};
        else
          startPos = { x: pos.x - partialWord.length, y: pos.y}
        const score = this.tempWordScore(partialWord, startPos, direction);
        this.legalMoves.push({ word: partialWord.map(x => ({...x})), score, startPos, direction });
      }
      for (const e in node.c) {
        const letter = this.getFromRack(e);
        if (letter) {
          if (sq.anchorData) {
            const crossList = direction === Direction.RIGHT ? sq.anchorData.topToBottom.crossList : sq.anchorData.leftToRight.crossList;
            if (!crossList.includes(e)) {
              continue;
            }
          }
          letter.value = e;
          this.removeFromRack(letter);
          partialWord.push(letter);
          this.extendRight(partialWord, node.c[e], nextPos(pos, direction), direction);
          partialWord.pop();
          this.insertInRack(letter);
        }
      }
    } else {
      const l = sq.value;
      if (l in node.c) {
        partialWord.push(new Letter(l));
        this.extendRight(partialWord, node.c[l], nextPos(pos, direction), direction)
        partialWord.pop();
      }
    }
  }

  leftPart(partialWord, node, limit, direction) {
    this.extendRight(partialWord, node, this.anchor, direction);
    if (limit > 0) {
      for (const e in node.c) {
        const letter = this.getFromRack(e);
        if (letter) {
          letter.value = e;
          this.removeFromRack(letter);
          partialWord.push(letter)
          this.leftPart(partialWord, node.c[e], limit - 1, direction);
          partialWord.pop();
          this.insertInRack(letter);
        }
      }
    }
  }

  wordToArray(word) {
    return [...word].map(x => new Letter(x));
  }

  generateMoves(anchor, direction) {
    this.anchor = anchor;
    const sq = this.square(anchor);

    // left to right
    const data = direction === Direction.RIGHT ? sq.anchorData.leftToRight : sq.anchorData.topToBottom;
    const leftPart = data.p1;
    if (leftPart) {
      // trivial left part
      this.extendRight(this.wordToArray(leftPart), this.trie.getWordNode(leftPart), anchor, direction);
    } else {
      this.leftPart([], this.trie.rootNode, data.limit, direction);
    }
  }

  limit(pos, direction) {
    let limit = 0;
    let sq = this.square(nextPos(pos, direction));
    while (!sq.value && !sq.anchorData && !sq.isBorder) {
      limit++;
      sq = this.square(nextPos(sq.pos, direction));
    }
    return limit;
  }

  anchorValue(anchorPos) {
    const leftPart = this.partialWordUtil(anchorPos, Direction.LEFT);
    const rightPart = this.partialWordUtil(anchorPos, Direction.RIGHT);
    const topPart = this.partialWordUtil(anchorPos, Direction.TOP);
    const bottomPart = this.partialWordUtil(anchorPos, Direction.BOTTOM);

    const leftToRight = {
      p1: reverse(leftPart.word),
      p2: rightPart.word,
      score: leftPart.score + rightPart.score,
      limit: this.limit(anchorPos, Direction.LEFT),
      crossList: [],
    }

    const topToBottom = {
      p1: reverse(topPart.word),
      p2: bottomPart.word,
      score: topPart.score + bottomPart.score,
      limit: this.limit(anchorPos, Direction.TOP),
      crossList: [],
    }

    if (this.trie) {

      // populate cross-check list

      if (!(leftToRight.p1 + leftToRight.p2)) {
        for (const l in LETTER_SCORES) {
          leftToRight.crossList.push(l);
        }
      }

      if (!(topToBottom.p1 + topToBottom.p2)) {
        for (const l in LETTER_SCORES) {
          topToBottom.crossList.push(l);
        }
      }

      const rackHasBlank = !!this.store.rack.find(x => x.blank);
      if (rackHasBlank) {
        for (const l in LETTER_SCORES) {
          if (this.trie.isWordValid(leftToRight.p1 + l + leftToRight.p2)) {
            leftToRight.crossList.push(l);
          }
          if (this.trie.isWordValid(topToBottom.p1 + l + topToBottom.p2)) {
            topToBottom.crossList.push(l);
          }
        }
      } else {
        const rackLetters = this.store.rack.map(x => x.value);
        for (const l of rackLetters) {
          if (this.trie.isWordValid(leftToRight.p1 + l + leftToRight.p2)) {
            leftToRight.crossList.push(l);
          }
          if (this.trie.isWordValid(topToBottom.p1 + l + topToBottom.p2)) {
            topToBottom.crossList.push(l);
          }
        }
      }
    }

    return { leftToRight, topToBottom };
  }

  findAnchors() {
    const b = this.store.board;
    const [nr, nc] = [b.length, b[0].length];
    const anchors = [];
    for (let x = 1; x < nr - 1; ++x) {
      for (let y = 1; y < nc - 1; ++y) {
        const s = b[x][y];
        s.anchorData = null;
        if (!s.value) {
          if (b[x + 1][y].value || b[x - 1][y].value || b[x][y + 1].value || b[x][y - 1].value) {
            anchors.push({ x, y });
            s.anchorData = this.anchorValue({ x, y });
          }
        }
      }
    }
    return anchors;
  }

  setRack(letters, numBlanks = 0) {
    [...letters].forEach(l => {
      this.insertInRack(new Letter(l));
    })
    while (numBlanks--) this.insertInRack(new Letter('', true));
  }

  async generateWords(maxCount = 50) {

    const anchors = this.findAnchors();

    if (!anchors.length) {
      // starting position
      const centerPos = {x: 8, y: 8};
      this.square(centerPos).anchorData = this.anchorValue(centerPos);
      anchors.push(centerPos);
    }

    this.legalMoves = [];
    for (const anchor of anchors) {
      this.generateMoves(anchor, Direction.BOTTOM);
      this.generateMoves(anchor, Direction.RIGHT);
      this.legalMoves.sort((a, b) => (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0));
      this.legalMoves = this.legalMoves.slice(0, maxCount);
    }

    // for (const move of this.legalMoves) {
    //   console.log(move);
    //   this.anchor = move.startPos;
    //   // this.tempWordScore(move.word, move.startPos, move.direction, false);
    //   this.focusWord(move.word, move.startPos, move.direction);
    //   await this.focusAndWait(move.startPos, 5000);
    //   this.removeTempData(move.word, move.startPos, move.direction);
    // }
    return this.legalMoves;
  }

}
