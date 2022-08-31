import { memo, useState } from "react";
import { Comestibles } from "./Comestibles";
import { DayEditor } from "./DayEditor";
import { Stats } from "./Stats";
import { SlimStorage } from "./storage";

export interface TabsProps {
    storage: SlimStorage;
}

const tabs = ["day", "stats", "comestibles"] as const;
type Tab = typeof tabs[number];

export const Tabs = memo(({ storage }: TabsProps) => {
    const { dispatch, state } = storage;

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
            ) : undefined}
        </div>
    );
});
