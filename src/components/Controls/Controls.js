import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '../../store';
import { resetBoard } from '../../service/utils';

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

  return (
    <div className="controls-container">
      <h3>Controls</h3>
      <label>
        Select a state file:
        <input
          type="file"
          onChange={handleFiles}
        />
      </label>
    </div>
  )
}

export default observer(Controls);
