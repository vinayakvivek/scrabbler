import React from 'react';
import { REWARD_TYPES } from '../service/square'

export default ({ data }) => {
  const reward = REWARD_TYPES[data.reward];
  const focus = data.focus ? 'focus' : '';
  return (
    <div className={`square ${reward} ${focus}`}>
      { data.value &&
        <div>
          <p className="value">{data.value}</p>
          <p className="score">{data.score}</p>
        </div>
      }
    </div>
  )
}