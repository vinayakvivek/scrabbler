
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

export class WordProcessor {

  constructor(board) {
    this.board = board;
  }

  square(pos) {
    const s = this.board[pos.x][pos.y];
    return s;
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

  partialWordScore(pos, direction) {
    const sq = this.square(pos);
    let score = 0;

    const part1 = this.partialWordUtil(pos, direction);
    const part2 = this.partialWordUtil(pos, oppositeDirection[direction]);

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
    let currSq = this.square(startPos);
    while (currSq.value) {
      let { partialScore, partialWord, invalid } = this.partialWordScore(currSq.pos, acrossDirection[direction]);
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
      currSq = this.square(nextPos(currSq.pos, direction));
    }

    if (dw) {
      score *= 2 * dw;
    }
    if (tw) {
      score *= 3 * tw;
    }
    console.log(score, extraScore, dw, tw);
  }

}