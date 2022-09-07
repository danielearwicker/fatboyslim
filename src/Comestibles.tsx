import { useState } from "react";
import { categories, Category, FatboyData, searchComestibles } from "./data";
import { chain as _ } from "underscore";
import { FatboyDispatch } from "./fatboyMethods";

export interface ConfigProps {
    state: FatboyData;
    dispatch: FatboyDispatch;
    showEditingDay(): void;
}

export function Comestibles({ state, dispatch, showEditingDay }: ConfigProps) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("latest");
    const [editing, setEditing] = useState("");
    const [calories, setCalories] = useState("");
    const [redMeat, setRedMeat] = useState("");

    const sorted = state.comestibles.slice(0);

    if (sort === "alpha") {
        sorted.sort((l, r) => l.name.localeCompare(r.name));
    } else if (sort === "latest") {
        sorted.reverse();
    }

    const filtered =
        search.trim().length === 0
            ? sorted
            : searchComestibles(sorted, search, x => false);

    return (
        <div className="config">
            <input
                placeholder="filter"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="alpha">Sort alphabetical</option>
                <option value="latest">Sort latest first</option>
            </select>
            {filtered.map(c => (
                <div
                    key={c.name}
                    className={`comestible ${c.redMeat ? " red-meat" : ""}`}>
                    <div>
                        <span className="name">{c.name}</span>
                        <span className="calories">{c.calories} kCal</span>
                        {!!c.redMeat && (
                            <span className="red-meat">
                                {c.redMeat}g red meat
                            </span>
                        )}
                    </div>
                    <select
                        className="category"
                        value={c.category}
                        onChange={e =>
                            dispatch(x =>
                                x.setCategory(
                                    e.target.value as Category,
                                    c.name
                                )
                            )
                        }>
                        {categories.map(cat => (
                            <option key={cat}>{cat}</option>
                        ))}
                    </select>
                    {!editing && (
                        <button
                            onClick={() => {
                                setCalories(`${c.calories}`);
                                setRedMeat(`${c.redMeat}`);
                                setEditing(c.name);
                            }}>
                            Edit
                        </button>
                    )}
                    {editing === c.name && (
                        <div className="editing">
                            <div>
                                <label>Calories</label>
                                <input
                                    type="number"
                                    className="calories"
                                    placeholder="Calories"
                                    value={calories}
                                    onChange={e => setCalories(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Red meat (g)</label>
                                <input
                                    type="number"
                                    className="red-meat"
                                    placeholder="Red meat"
                                    value={redMeat}
                                    onChange={e => setRedMeat(e.target.value)}
                                />
                            </div>
                            <div>
                                <button
                                    disabled={
                                        isNaN(parseFloat(calories)) ||
                                        isNaN(parseFloat(redMeat))
                                    }
                                    onClick={() => {
                                        dispatch(x =>
                                            x.configureComestible(
                                                c.name,
                                                parseFloat(calories),
                                                parseFloat(redMeat)
                                            )
                                        );
                                        setEditing("");
                                    }}>
                                    Save
                                </button>
                                <button onClick={() => setEditing("")}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="days">
                        {_(state.days)
                            .filter(x =>
                                x.ate.some(a => a.comestible === c.name)
                            )
                            .sortBy(x => x.date)
                            .reverse()
                            .slice(0, 3)
                            .map(x => (
                                <span
                                    className="ate"
                                    onClick={() => {
                                        dispatch(d => d.setEditingDate(x.date));
                                        showEditingDay();
                                    }}>
                                    {x.date}
                                </span>
                            ))
                            .value()}
                    </div>
                </div>
            ))}
        </div>
    );
}
