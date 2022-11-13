import { useState } from "react";
import { categories, Category, FatboyData, searchComestibles } from "./data";
import { FatboyAction } from "./reducer";
import { chain as _ } from "underscore";

export interface ConfigProps {
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
    showEditingDay(): void;
}

export function Comestibles({ state, dispatch, showEditingDay }: ConfigProps) {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("latest");
    const [editing, setEditing] = useState("");
    const [calories, setCalories] = useState("");
    const [redMeat, setRedMeat] = useState("");
    const [name, setName] = useState("");

    const sorted = state.comestibles.slice(0);

    if (sort === "alpha") {
        sorted.sort((l, r) => l.label.localeCompare(r.label));
    } else if (sort === "calories") {
        sorted.sort((l, r) => r.calories - l.calories);
    } else if (sort === "category") {
        sorted.sort((l, r) => l.category.localeCompare(r.category));
    } else if (sort === "latest") {
        sorted.reverse();
    }

    const filtered =
        search.trim().length === 0
            ? sorted
            : searchComestibles(sorted, search, Number.MAX_VALUE).map(
                  x => x.comestible
              );

    return (
        <div className="config">
            <input
                placeholder="filter"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="alpha">Sort alphabetically</option>
                <option value="latest">Sort latest first</option>
                <option value="calories">Sort by calories</option>
                <option value="category">Sort by category</option>
            </select>
            {filtered.map(c => (
                <div
                    key={c.id}
                    className={`comestible ${c.redMeat ? " red-meat" : ""}`}>
                    <div>
                        <span className="name">{c.label}</span>
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
                            dispatch({
                                type: "SET_CATEGORY",
                                comestible: c.id,
                                category: e.target.value as Category,
                            })
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
                                setName(c.label);
                                setEditing(c.id);
                            }}>
                            Edit
                        </button>
                    )}
                    {editing === c.id && (
                        <div className="editing">
                            <div>
                                <label>Name</label>
                                <input
                                    className="name"
                                    placeholder="Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
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
                                        dispatch({
                                            type: "CONFIGURE_COMESTIBLE",
                                            comestible: editing,
                                            calories: parseFloat(calories),
                                            redMeat: parseFloat(redMeat),
                                            newName: name,
                                        });
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
                            .filter(x => x.ate.some(a => a.comestible === c.id))
                            .sortBy(x => x.date)
                            .reverse()
                            .slice(0, 3)
                            .map(x => (
                                <span
                                    className="ate"
                                    key={x.date}
                                    onClick={() => {
                                        dispatch({
                                            type: "SET_EDITING_DATE",
                                            date: x.date,
                                        });
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
