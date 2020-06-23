
export const Direction = {
  RIGHT: 0,
  LEFT: 1,
  BOTTOM: 2,
  TOP: 3
}

export const Reward = {
  TW: 1,
  TL: 2,
  DW: 3,
  DL: 4
}

function nextPos(pos, direction) {
  let { x, y } = pos;
  switch (direction) {
    case Direction.RIGHT:
      y++; break;
    case Direction.LEFT:
      y--; break;
    case Direction.BOTTOM:
      x++; break;
    case Direction.TOP:
      x--; break;
    default:
  }
  return { x, y }
}

function timer(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function reverse(s) {
  return [...s].reverse().join('');
}

class Letter {
  constructor(value, blank = false) {
    this.value = value;
    this.blank = blank;
  }
}

export class WordProcessor {

  constructor(store, trie) {
    this.store = store;
    this.board = store.board;
    this.setFocus = store.setFocus;
    this.trie = trie;
    this.rack = {};
    this.anchor = { x: 9, y: 8 }
    this.setFocus(this.anchor);
  }



  removeFromRack(letter) {
    delete this.rack[letter];
  }

  insertInRack(letter) {
    this.rack[letter] = 1;
  }

  async focusAndWait(pos, time = 500) {
    this.setFocus(pos);
    await timer(time);
  }

  square(pos) {
    return this.board[pos.x][pos.y];
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

  removeTempData(word, startPos, direction) {
    let sq = this.square(startPos);
    let n = word.length;
    while (!sq.isBorder && n--) {
      sq.removeTempTile();
      sq = this.square(nextPos(sq.pos, direction))
    }
  }

  tempWordScore(word, startPos, direction, removeTempData = true) {
    const letters = [...word];
    let sq = this.square(startPos);
    let [score, extraScore, dw, tw] = [0, 0, 0, 0];
    for (const letter of letters) {
      if (sq.value) {
        score += sq.score;
      } else {
        sq.setTempTile(letter);
        score += sq.tempScore;
        switch (sq.reward) {
          case Reward.TW:
            tw++; break;
          case Reward.TL:
            score += 2 * sq.tempScore; break;
          case Reward.DW:
            dw++; break;
          case Reward.DL:
            score += sq.tempScore; break;
          default:
        }
        if (sq.anchorData) {
          let data = direction === Direction.RIGHT || direction === Direction.LEFT
                      ? sq.anchorData.topToBottom : sq.anchorData.leftToRight;
          const acrossWord = data.p1 + letter + data.p2;
          if (acrossWord.length > 1) {
            switch (sq.reward) {
              case Reward.TW:
                extraScore += 3 * (data.score + sq.tempScore); break;
              case Reward.TL:
                extraScore += (data.score + 3 * sq.tempScore); break;
              case Reward.DW:
                extraScore += 2 * (data.score + sq.tempScore); break;
              case Reward.DL:
                extraScore += (data.score + 2 * sq.tempScore); break;
              default:
                extraScore += (data.score + sq.tempScore);
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
    if (removeTempData)
      this.removeTempData(word, startPos, direction);
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
      if (node.t && this.checkPositionValidity(pos, direction) && partialWord) {
        let startPos;
        if (direction === Direction.RIGHT)
          startPos = { x: pos.x, y: pos.y - partialWord.length};
        else
          startPos = { x: pos.x - partialWord.length, y: pos.y}
        const score = this.tempWordScore(partialWord, startPos, direction);
        this.legalMoves.push({ word: partialWord, score, startPos, direction });
      }
      for (const e in node.c) {
        if (e in this.rack) {
          if (sq.anchorData) {
            const crossList = direction === Direction.RIGHT ? sq.anchorData.topToBottom.crossList : sq.anchorData.leftToRight.crossList;
            if (!crossList.includes(e))
              continue;
          }
          this.removeFromRack(e);
          this.extendRight(partialWord + e, node.c[e], nextPos(pos, direction), direction);
          this.insertInRack(e);
        }
      }
    } else {
      const l = sq.value;
      if (l in node.c) {
        this.extendRight(partialWord + l, node.c[l], nextPos(pos, direction), direction)
      }
    }
  }

  leftPart(partialWord, node, limit, direction) {
    this.extendRight(partialWord, node, this.anchor, direction);
    if (limit > 0) {
      for (const e in node.c) {
        if (e in this.rack) {
          this.removeFromRack(e);
          this.leftPart(partialWord + e, node.c[e], limit - 1, direction);
          this.insertInRack(e);
        }
      }
    }
  }

  generateMoves(anchor, direction) {
    this.anchor = anchor;
    const sq = this.square(anchor);

    // left to right
    const data = direction === Direction.RIGHT ? sq.anchorData.leftToRight : sq.anchorData.topToBottom;
    if (data.p1) {
      // trivial left part
      this.extendRight(data.p1, this.trie.getWordNode(data.p1), anchor, direction);
    } else {
      this.leftPart('', this.trie.rootNode, data.limit, direction);
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
      for (const letter in this.rack) {
        if (this.trie.isWordValid(leftToRight.p1 + letter + leftToRight.p2)) {
          leftToRight.crossList.push(letter);
        }
        if (this.trie.isWordValid(topToBottom.p1 + letter + topToBottom.p2)) {
          topToBottom.crossList.push(letter);
        }
      }
    }

    return { leftToRight, topToBottom };
  }

  findAnchors() {
    const b = this.board;
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

  setRack(letters) {
    [...letters].forEach(l => {
      this.insertInRack(l);
    })
  }

  async generateWords() {

    this.setRack('IVTIIBR');

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
      this.legalMoves = this.legalMoves.slice(0, 50);
    }


    for (const move of this.legalMoves) {
      console.log(move);
      this.anchor = move.startPos;
      this.tempWordScore(move.word, move.startPos, move.direction, false);
      await this.focusAndWait(move.startPos, 2000);
      this.removeTempData(move.word, move.startPos, move.direction);
    }
    console.log(this.trie.rootNode);
  }

}