
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

  async partialWordScore(pos, direction) {
    const sq = await this.square(pos);
    let score = 0;

    const part1 = await this.partialWordUtil(pos, direction);
    const part2 = await this.partialWordUtil(pos, oppositeDirection[direction]);

    const word = [...part2.word].reverse().join('') + sq.value + part1.word;
    if (word.length === 1) {
      return { partialScore: 0, partialWord: '', invalid: false }
    }
    // TODO: check word validity with trie

    score += part1.score + part2.score;
    switch (sq.reward) {
      case Reward.TW:
        score = 3 * (score + sq.score); break;
      case Reward.TL:
        score += 3 * sq.score; break;
      case Reward.DW:
        score = 2 * (score + sq.score); break;
      case Reward.DL:
        score += 2 * sq.score; break;
      default:
        score += sq.score;
    }
    return { partialScore: score, partialWord: word, invalid: false }
  }

  async wordScore(startPos, direction) {
    let [score, extraScore, dw, tw] = [0, 0, 0, 0];
    let currSq = await this.square(startPos);
    currSq.focus = true;
    while (currSq.value) {
      let { partialScore, partialWord, invalid } = await this.partialWordScore(currSq.pos, acrossDirection[direction]);
      console.log({ partialScore, partialWord, invalid });
      if (invalid) {
        console.log(`Invalid across word at ${currSq.pos}: ${partialWord}`);
        return -1;
      }
      score += currSq.score;
      switch (currSq.reward) {
        case Reward.TW:
          tw++; break;
        case Reward.TL:
          score += 2 * currSq.score; break;
        case Reward.DW:
          dw++; break;
        case Reward.DL:
          score += currSq.score; break;
        default:
      }
      extraScore += partialScore;
      currSq = await this.square(nextPos(currSq.pos, direction));
    }

    if (dw) {
      score *= 2 * dw;
    }
    if (tw) {
      score *= 3 * tw;
    }
    console.log(score, extraScore, dw, tw);
  }

  async tempWordScore(word, anchor, direction) {

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
            this.setFocus({ x, y });
            await timer(500);
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
    // await this.leftPart('', this.trie.rootNode, 5);
  }

}