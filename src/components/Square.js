import React, { useEffect } from 'react';
import { REWARD_TYPES } from '../service/square'
import { observer } from "mobx-react";
import { useStore } from '../store'

const Square = ({ pos }) => {

  const store = useStore();
  const data = store.board[pos.x][pos.y];
  const reward = REWARD_TYPES[data.reward];
  const focus = (store.posInFocus.x === pos.x) && (store.posInFocus.y === pos.y) ? 'focus' : '';

  return (
    <div className={`square ${reward} ${focus}`}>
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
            data.anchorData !== null && (
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