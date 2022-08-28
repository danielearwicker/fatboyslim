import { useState } from "react";
import { SlimStorage, slimStorage } from "./storage";
import "./styles.scss";

export interface ConfigureStorageProps {
  setStorage(storage: SlimStorage): void;
} 

export function ConfigureStorage({ setStorage }: ConfigureStorageProps) {
  const [sasToken, setSasToken] = useState("");
  
  function save() {
    const storage = slimStorage();
    storage.setSasToken(sasToken);
    setStorage(storage);
  }

  return (
    <div>
      <div>Enter SAS token</div>
      <div>
        <input type="password" value={sasToken} onChange={e => setSasToken(e.target.value)} />
      </div>
      <div>
        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}
