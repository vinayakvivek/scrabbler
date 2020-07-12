import React from 'react';
import { processor } from '../../service/utils';
import { useStore } from '../../store';

const Move = ({ data }) => {

  const store = useStore();

  const handleClick = () => {
    processor.removeAllTempData();
    processor.focusWord(data.word, data.startPos, data.direction);
    store.posInFocus = data.startPos;
  }

  return (
    <div className="move-wrapper" onClick={handleClick}>
      <p>{data.word.map(letter => letter.value).join('')} ({data.score})</p>
    </div>
  )
}

export default Move;
