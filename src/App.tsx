import { useState } from "react";
import { ConfigureStorage } from "./ConfigureStorage";
import { FatboySlim } from "./FatboySlim";
import { useSlimStorage } from "./storage";
import "./styles.scss";

export default function App() {
  const storage = useSlimStorage();

  return (
    <div className="App">
      {        
        !storage.configured ? <ConfigureStorage storage={storage} /> : <FatboySlim storage={storage} />
      }      
    </div>
  );
}
