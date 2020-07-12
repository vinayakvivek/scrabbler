import React from 'react';
import { REWARD_TYPES } from '../service/square'
import { observer } from "mobx-react";
import { useStore } from '../store'
import { processor } from '../service/utils';


const Square = ({ pos }) => {

  const store = useStore();
  const data = store.board[pos.x][pos.y];
  const reward = REWARD_TYPES[data.reward];
  const focus = (store.posInFocus.x === pos.x) && (store.posInFocus.y === pos.y) ? 'focus' : '';
  const wordFocus = !!data.focus ? 'focus' : '';

  const showAnchorData = false;
  const temp = !!data.tempValue ? 'temp' : '';

  const handleClick = (e) => {
    store.posInFocus = pos
    processor.removeAllTempData();
  }

  const handleDoubleClick = (e) => {
    try {
      store.board[pos.x][pos.y].removeTile();
      handleClick();
    } catch (err) {
      console.log(err.message);
    }
  }

  return (
    <div
      className={`square ${reward} ${focus} ${wordFocus} ${temp}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      { data.value ? (
          <div>
            <p className="value">{data.value}</p>
            <p className="score">{data.score}</p>
          </div>
        ) : (
          data.tempValue ? (
            <div>
              <p className="value">{data.tempValue}</p>
              <p className="score">{data.tempScore}</p>
            </div>
          ) : (
            showAnchorData && data.anchorData !== null && (
              <div>
                <p className="anchor-score">{`${data.anchorData.leftToRight.score} ${data.anchorData.topToBottom.score}`}</p>
                <p className="anchor-limit">{`${data.anchorData.leftToRight.limit} ${data.anchorData.topToBottom.limit}`}</p>
              </div>
            )
          )
        )
      }
    </div>
  )
}

export default observer(Square);