import React from 'react';
import { REWARD_TYPES } from '../service/square'

export default ({ data }) => {
  const reward = REWARD_TYPES[data.reward];
  return (
    <div className={`square ${reward}`}>
      { data.value &&
        <div>
          <p className="value">{data.value}</p>
          <p className="score">{data.score}</p>
        </div>
      }
    </div>
  )
}