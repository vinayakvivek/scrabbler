import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../../store';
import { resetBoard, state, syncState } from '../../service/utils';

const Controls = () => {

  let fileReader;
  const store = useStore();

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

  return (
    <div className="controls-container">
      <h3>Controls</h3>
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
    </div>
  )
}

export default observer(Controls);
