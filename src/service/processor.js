
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
    this.rack = [..."OUTGREW"];
    this.anchor = { x: 9, y: 8 }
    this.setFocus(this.anchor);
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

  async square(pos) {
    // this.setFocus(pos);
    // await timer(500);
    return this.board[pos.x][pos.y];
  }

  async partialWordUtil(pos, direction) {
    let score = 0;
    let word = ''
    let currSq = await this.square(nextPos(pos, direction));
    while (currSq.value) {
      score += currSq.score;
      word += currSq.value;
      currSq = await this.square(nextPos(currSq.pos, direction));
    }
    return { score, word };
  }

  async tempWordScore(word, startPos, direction) {
    const letters = [...word];
    let sq = await this.square(startPos);
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
          let data = direction === Direction.RIGHT ? sq.anchorData.topToBottom : sq.anchorData.leftToRight;
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
      this.setFocus(sq.pos);
      await timer(500);
      sq = await this.square(nextPos(sq.pos, direction))
    }
    if (dw) {
      score *= 2 * dw;
    }
    if (tw) {
      score *= 3 * tw;
    }
    console.log(score, extraScore, dw, tw);
  }

  async leftPart(partialWord, node, limit) {
    // extend right
    if (limit > 0) {
      for (const e in node.c) {
        if (this.rack.includes(e)) {
          this.placeTile(e);
        }
      }
    }
  }

  async limit(pos, direction) {
    let limit = 0;
    let sq = await this.square(nextPos(pos, direction));
    while (!sq.value && !sq.isBorder) {
      limit++;
      sq = await this.square(nextPos(sq.pos, direction));
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
      limit: await this.limit(anchorPos, Direction.LEFT)
    }

    const topToBottom = {
      p1: reverse(topPart.word),
      p2: bottomPart.word,
      score: topPart.score + bottomPart.score,
      limit: await this.limit(anchorPos, Direction.TOP)
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
            // this.setFocus({ x, y });
            // await timer(500);
          }
        }
      }
    }
    return anchors;
  }

  async generateWords() {
    const pos = { x: 8, y: 7 };
    // console.log(await this.limit(pos, Direction.LEFT));
    // this.setFocus(pos);
    await this.findAnchors();
    await this.tempWordScore('OUTGREW', { x: 9, y: 2 }, Direction.RIGHT);
    // await this.leftPart('', this.trie.rootNode, 5);
  }

}