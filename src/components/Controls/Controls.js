import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../../store';
import { resetBoard, state, syncState, processor, Direction, Letter } from '../../service/utils';
import Move from './Move';
import UpdateRewards from './UpdateRewards';


const Controls = () => {

  let fileReader;
  const store = useStore();
  const [word, setWord] = useState('');
  const [direction, setDirection] = useState(0);
  const [wordBlankPos, setWordBlankPos] = useState([]);
  const [rack, setRack] = useState('');
  const [rackBlanks, setRackBlanks] = useState(0);
  const [moves, setMoves] = useState([]);

  const handleFileRead = () => {
    try {
      const content = JSON.parse(fileReader.result);
      resetBoard(store, content);
    } catch (err) {
      console.log(err);
    }
  };

  const handleFileChosen = (file) => {
    fileReader = new FileReader();
    fileReader.onloadend = handleFileRead;
    fileReader.readAsText(file);
  };

  const handleFiles = (e) => {
    handleFileChosen(e.target.files[0]);
  }

  const handleDownload = async () => {
    syncState(store);
    const fileName = "scrabble-state";
    const json = JSON.stringify(state);
    const blob = new Blob([json],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const posToString = (pos) => {
    return `(${pos.x}, ${pos.y})`;
  }

  const placeWord = () => {
    if (!word) return;
    try {
      const wordArray = [...word].map(l => new Letter(l.toUpperCase()));
      wordBlankPos.forEach(i => wordArray[parseInt(i)].blank = true);
      processor.placeWord(wordArray, store.posInFocus, direction);
      store.posInFocus = {x: 1, y: 1};
    } catch (err) {
      console.log(err.message);
    }
  }

  const placeRack = () => {
    const rackArray = [...rack].map(l => new Letter(l.toUpperCase()));
    for (let i = 0; i < rackBlanks; ++i) {
      rackArray.push(new Letter('', true));
    }
    store.rack = rackArray;
    store.posInFocus = {x: 1, y: 1};
  }

  const generateMoves = async () => {
    setMoves(await processor.generateWords());
  }

  const renderMoves = () => {
    const moveList = [];
    for (const i in moves) {
      moveList.push(<Move data={moves[i]} key={i}/>)
    }
    return moveList;
  }

  return (
    <div className="controls-container">
      <h2>Controls</h2>
      <div>
        <label>
          Select a state file:
          <input
            type="file"
            onChange={handleFiles}
          />
        </label>
      </div>
      <div>
        { !!store.status && <button onClick={handleDownload}>Download</button> }
      </div>
      <UpdateRewards/>
      <div className="add-word-container">
        <h3>Add word</h3>
        <label>Start position</label>
        <input type='text' disabled value={posToString(store.posInFocus)}></input>
        <br/>
        <label>Direction: </label>
        <select name="direction" id="direction" onChange={(e) => setDirection(parseInt(e.target.value))}>
          <option value={Direction.RIGHT}>Horizontal</option>
          <option value={Direction.BOTTOM}>Vertical</option>
        </select>
        <input type='text' value={word} onChange={(e) => setWord(e.target.value)}></input>
        <br/>
        <label>Blank positions</label>
        <input type='text' value={wordBlankPos.join(',')} onChange={(e) => setWordBlankPos(e.target.value.split(','))}></input>
        <br/>
        <button onClick={placeWord}>Add word</button>
      </div>
      <div className="set-rack-container">
        <h3>Set rack</h3>
        <label>Rack tiles</label>
        <input type='text' value={rack} onChange={(e) => setRack(e.target.value)}></input>
        <br/>
        <label>#blanks</label>
        <input type='number' value={rackBlanks} onChange={(e) => setRackBlanks(e.target.value)}></input>
        <br/>
        <button onClick={placeRack}>Set rack tiles</button>
      </div>
      <div className='moves-container'>
        <h3>Moves</h3>
        <button onClick={generateMoves}>Generate next legal moves</button>
        <br/>
        { renderMoves() }
      </div>
    </div>
  )
}

export default observer(Controls);
