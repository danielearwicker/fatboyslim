import { memo, useState } from "react";
import { Body } from "./Body";
import { Comestibles } from "./Comestibles";
import { DayEditor } from "./DayEditor";
import { Notes } from "./Notes";
import { useFatboyStorage } from "./reducer";
import { Stats } from "./Stats";

const tabs = ["day", "stats", "comestibles", "body", "notes"] as const;
type Tab = typeof tabs[number];

export const Tabs = memo(() => {
    const [state, dispatch] = useFatboyStorage();

    const [tab, setTab] = useState<Tab>("day");

    return (
        <div className="fatboy-slim">
            <div className="tabs">
                {tabs.map(t => (
                    <div
                        key={t}
                        className={`tab${t === tab ? " selected" : ""}`}
                        onClick={() => setTab(t)}>
                        {t}
                    </div>
                ))}
            </div>
            {tab === "day" ? (
                <DayEditor state={state} dispatch={dispatch} />
            ) : tab === "stats" ? (
                <Stats state={state} />
            ) : tab === "comestibles" ? (
                <Comestibles
                    state={state}
                    dispatch={dispatch}
                    showEditingDay={() => setTab("day")}
                />
            ) : tab === "body" ? (
                <Body state={state} dispatch={dispatch} />
            ) : tab === "notes" ? (
                <Notes state={state} dispatch={dispatch} />
            ) : undefined}
        </div>
    );
});
