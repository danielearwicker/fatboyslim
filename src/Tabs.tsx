import { memo, useState } from "react";
import { Config } from "./Config";
import { FatboyData, searchComestibles } from "./data";
import { DayEditor } from "./DayEditor";
import { FatboyAction } from "./reducer";
import { Stats } from "./Stats";
import { SlimStorage } from "./storage";

export interface TabsProps {
  storage: SlimStorage
}

const tabs = ["day", "stats", "config"] as const;
type Tab = typeof tabs[number];

export const Tabs = memo(({ storage }: TabsProps) => {
  const { dispatch, state } = storage;

  const [tab, setTab] = useState<Tab>("day");

  return (
    <div className="fatboy-slim">
      <div className="tabs">
        { tabs.map(t => (
          <div key={t} className={`tab${t === tab ? " selected" : ""}`} onClick={() => setTab(t)}>{t}</div>  
        ))}
      </div>
      {
        tab === "day" ? <DayEditor state={state} dispatch={dispatch} /> :
        tab === "stats" ? <Stats state={state} /> : 
        tab === "config" ? <Config state={state} dispatch={dispatch} /> : undefined
      }      
    </div>
  );
});
