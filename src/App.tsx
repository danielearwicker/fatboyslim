import { ConfigureStorage } from "./ConfigureStorage";
import { Tabs } from "./Tabs";
import { useSlimStorage } from "./storage";
import "./styles.scss";

export default function App() {
  const storage = useSlimStorage();

  return (
    <div className="App">
      {        
        !storage.configured ? <ConfigureStorage storage={storage} /> : <Tabs storage={storage} />
      }      
    </div>
  );
}
