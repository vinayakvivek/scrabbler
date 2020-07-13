import React, { useState, useEffect } from 'react';
import { Reward } from '../../service/utils';
import { useStore } from '../../store';

const UpdateRewards = () => {

  const store = useStore();

  const [update, setUpdate] = useState(false);
  const [type, setType] = useState(Reward.NA);

  useEffect(() => {
    if (!update) return;
    try {
      const {x, y} = store.posInFocus;
      const sq = store.board[x][y];
      sq.reward = type;
    } catch (err) {
      console.log(err.message);
    }
    // eslint-disable-next-line
  }, [store.posInFocus, update])

  return (
    <div className="update-rewards-container">
      <h2>Update rewards</h2>
      <label>update? </label>
      <input type="checkbox" checked={update} onChange={e => setUpdate(!update)}></input>
      <br/>
      <label>Type: </label>
      <select name="reward-type" id="reward-type" onChange={(e) => setType(parseInt(e.target.value))}>
        <option value={Reward.NA}>None</option>
        <option value={Reward.DL}>DL</option>
        <option value={Reward.DW}>DW</option>
        <option value={Reward.TL}>TL</option>
        <option value={Reward.TW}>TW</option>
      </select>
    </div>
  )
}

export default UpdateRewards;
