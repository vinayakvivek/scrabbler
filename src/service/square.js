
export const REWARD_TYPES = {
  0: 'N',
  1: 'TW',
  2: 'TL',
  3: 'DW',
  4: 'DL'
}

export const LETTER_SCORES = {
  'A': 1, 'B': 4, 'C': 4, 'D': 2, 'E': 1, 'F': 4, 'G': 3, 'H': 4, 'I': 1, 'J': 10, 'K': 5, 'L': 1, 'M': 3, 'N': 1, 'O': 1, 'P': 4, 'Q': 10, 'R': 1, 'S': 1, 'T': 1, 'U': 2, 'V': 4, 'W': 4, 'X': 8, 'Y': 4, 'Z': 10,
}

export class Square {

  constructor(position, reward, isBorder = false) {
    this.pos = position;
    this.isBorder = isBorder;
    this.reward = reward;
    this.value = null;
    this.score = 0;
    this.anchorData = null;
  }

  setTile(value, score) {
    if (score === undefined) score = LETTER_SCORES[value];
    this.score = score;
    this.value = value;
  }

  removeTile() {
    this.value = null;
    this.score = 0;
  }

  setTempTile(value, score) {
    if (score === undefined) score = LETTER_SCORES[value];
    this.tempScore = score;
    this.tempValue = value;
  }

  removeTempTile() {
    this.tempScore = null;
    this.tempValue = 0;
  }

}