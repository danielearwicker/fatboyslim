import { useState } from "react";
import { ConfigureStorage } from "./ConfigureStorage";
import { FatboySlim } from "./FatboySlim";
import { slimStorage } from "./storage";
import "./styles.scss";

export default function App() {
  const [storage, setStorage] = useState(slimStorage());

  return (
    <div className="App">
      {        
        !storage.configured ? <ConfigureStorage setStorage={setStorage} /> : <FatboySlim storage={storage} />
      }      
    </div>
  );
}
