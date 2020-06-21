
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

const oppositeDirection = [
  Direction.LEFT, Direction.RIGHT,
  Direction.TOP, Direction.BOTTOM
]

const acrossDirection = [
  Direction.BOTTOM, Direction.BOTTOM,
  Direction.RIGHT, Direction.RIGHT
]

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

  async removeFromRack(letter) {
    delete this.rack[letter];
  }

  async insertInRack(letter) {
    this.rack[letter] = 1;
  }

  async placeTile(pos, letter) {
    this.board[pos.x][pos.y].setTile(letter);
    this.rack.remove(letter);
  }

  async putBackTile(pos) {
    const s = this.board[pos.x][pos.y];
    this.rack.push(s.value);
    s.removeTile();
  }

  async focusAndWait(pos, time = 500) {
    this.setFocus(pos);
    await timer(time);
  }

  square(pos) {
    return this.board[pos.x][pos.y];
  }

  async partialWordUtil(pos, direction) {
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

  async removeTempData(word, startPos, direction) {
    let sq = this.square(startPos);
    let n = word.length;
    while (!sq.isBorder && n--) {
      sq.removeTempTile();
      sq = this.square(nextPos(sq.pos, direction))
    }
  }

  async tempWordScore(word, startPos, direction, animate = false) {
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
            // TODO: check validity
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
      // await this.focusAndWait(sq.pos);
      sq = this.square(nextPos(sq.pos, direction))
    }
    if (dw) {
      score *= 2 * dw;
    }
    if (tw) {
      score *= 3 * tw;
    }
    if (animate) await this.focusAndWait(this.anchor, 100);
    await this.removeTempData(word, startPos, direction);
    // console.log(score, extraScore, dw, tw);
    return score + extraScore;
  }

  async extendRight(partialWord, node, pos) {
    const sq = this.square(pos);
    if (!sq.value) {
      if (node.t) {
        const startPos = { x: pos.x, y: pos.y - partialWord.length};
        const score = await this.tempWordScore(partialWord, startPos, Direction.RIGHT);
        this.legalMoves.push({ word: partialWord, score, startPos });
      }
      for (const e in node.c) {
        if (e in this.rack) {
          if (sq.anchorData && !sq.anchorData.topToBottom.crossList.includes(e)) {
            continue;
          }
          this.removeFromRack(e);
          await this.extendRight(partialWord + e, node.c[e], nextPos(pos, Direction.RIGHT));
          this.insertInRack(e);
        }
      }
    } else {
      const l = sq.value;
      if (l in node.c) {
        await this.extendRight(partialWord + l, node.c[l], nextPos(pos, Direction.RIGHT))
      }
    }
  }

  async leftPart(partialWord, node, limit) {
    // console.log(partialWord);
    // if (partialWord.length > 0) {
    //   let { x, y } = this.anchor;
    //   y -= (partialWord.length - 1);
    //   await this.tempWordScore(partialWord, {x, y}, Direction.RIGHT);
    // }
    // extend right
    await this.extendRight(partialWord, node, this.anchor);
    if (limit > 0) {
      for (const e in node.c) {
        if (e in this.rack) {
          this.removeFromRack(e);
          await this.leftPart(partialWord + e, node.c[e], limit - 1);
          this.insertInRack(e);
        }
      }
    }
  }

  async limit(pos, direction) {
    let limit = 0;
    let sq = this.square(nextPos(pos, direction));
    while (!sq.value && !sq.isBorder) {
      limit++;
      sq = this.square(nextPos(sq.pos, direction));
    }
    return limit;
  }

  async anchorValue(anchorPos) {
    const leftPart = await this.partialWordUtil(anchorPos, Direction.LEFT);
    const rightPart = await this.partialWordUtil(anchorPos, Direction.RIGHT);
    const topPart = await this.partialWordUtil(anchorPos, Direction.TOP);
    const bottomPart = await this.partialWordUtil(anchorPos, Direction.BOTTOM);

    const leftToRight = {
      p1: reverse(leftPart.word),
      p2: rightPart.word,
      score: leftPart.score + rightPart.score,
      limit: await this.limit(anchorPos, Direction.LEFT),
      crossList: [],
    }

    const topToBottom = {
      p1: reverse(topPart.word),
      p2: bottomPart.word,
      score: topPart.score + bottomPart.score,
      limit: await this.limit(anchorPos, Direction.TOP),
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

  async findAnchors() {
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
            s.anchorData = await this.anchorValue({ x, y });
          }
        }
      }
    }
    return anchors;
  }

  async generateWords() {

    this.insertInRack('O');
    this.insertInRack('U');
    this.insertInRack('T');
    this.insertInRack('G');
    this.insertInRack('R');
    this.insertInRack('E');
    this.insertInRack('W');

    const anchors = await this.findAnchors();
    // await this.tempWordScore('OUTGREW', { x: 9, y: 2 }, Direction.RIGHT);
    // await this.tempWordScore('OUTGREW', { x: 7, y: 5 }, Direction.RIGHT);
    this.anchor = { x: 9, y: 8 };
    const limit = (this.square(this.anchor)).anchorData.leftToRight.limit;

    console.log(this.square(this.anchor).anchorData);
    this.legalMoves = [];
    await this.leftPart('', this.trie.rootNode, 2);
    this.legalMoves.sort((a, b) => (a.score < b.score) ? 1 : ((b.score < a.score) ? -1 : 0));
    console.log(this.legalMoves);



    // await this.leftPart('', this.trie.rootNode, 5);
  }

}