import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../../store';
import { resetBoard, state, syncState, processor, Direction, Letter } from '../../service/utils';


const Controls = () => {

  let fileReader;
  const store = useStore();
  const [word, setWord] = useState('');
  const [direction, setDirection] = useState(0);
  const [rack, setRack] = useState('');
  const [rackBlanks, setRackBlanks] = useState(0);

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
    const wordArray = [...word].map(l => new Letter(l.toUpperCase()));
    processor.placeWord(wordArray, store.posInFocus, direction);
    store.posInFocus = {x: 1, y: 1};
  }

  const placeRack = () => {
    const rackArray = [...rack].map(l => new Letter(l.toUpperCase()));
    for (let i = 0; i < rackBlanks; ++i) {
      rackArray.push(new Letter('', true));
    }
    store.rack = rackArray;
    store.posInFocus = {x: 1, y: 1};
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
        <button onClick={placeWord}>Add word</button>
      </div>
      <div className="set-rack-container">
        <h3>Set rack</h3>
        <input type='text' value={rack} onChange={(e) => setRack(e.target.value)}></input>
        <input type='number' value={rackBlanks} onChange={(e) => setRackBlanks(e.target.value)}></input>
        <button onClick={placeRack}>Set rack tiles</button>
      </div>
    </div>
  )
}

export default observer(Controls);
