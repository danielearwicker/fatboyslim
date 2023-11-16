import { useMemo, useState } from "react";
import { categories, Category, FatboyData, searchComestibles } from "./data";
import { FatboyAction } from "./reducer";
import { chain as _ } from "underscore";

export interface ConfigProps {
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
    showEditingDay(): void;
    search: string;
    setSearch(name: string): void;
}

export function Comestibles({
    state,
    dispatch,
    showEditingDay,
    search,
    setSearch,
}: ConfigProps) {
    const daysByComestible = useMemo(() => {
        const result: { [id: string]: string[] } = {};

        for (const day of state.days) {
            for (const a of day.ate) {
                const days =
                    result[a.comestible] ?? (result[a.comestible] = []);
                days.push(day.date);
            }
        }

        for (const [id, days] of Object.entries(result)) {
            days.sort();
            days.reverse();
        }

        return result;
    }, [state.days]);

    const [sort, setSort] = useState("latest");
    const [descending, setDescending] = useState(true);
    const [category, setCategory] = useState("");

    const [editing, setEditing] = useState("");
    const [calories, setCalories] = useState("");
    const [redMeat, setRedMeat] = useState("");
    const [sugar, setSugar] = useState("");
    const [alcohol, setAlcohol] = useState("");
    const [satch, setSatch] = useState("");
    const [name, setName] = useState("");

    const sorted = state.comestibles.slice(0);

    if (sort === "alpha") {
        sorted.sort((l, r) => l.label.localeCompare(r.label));
    } else if (sort === "calories") {
        sorted.sort((l, r) => l.calories - r.calories);
    } else if (sort === "category") {
        sorted.sort((l, r) => l.category.localeCompare(r.category));
    } else if (sort === "satch") {
        sorted.sort((l, r) => (l.satch ?? 0) - (r.satch ?? 0));
    } else if (sort === "eaten") {
        sorted.sort((l, r) => {
            const lDate = daysByComestible[l.id]?.[0] ?? "2000-01-01";
            const rDate = daysByComestible[r.id]?.[0] ?? "2000-01-01";
            return lDate.localeCompare(rDate);
        });
    }

    if (descending) {
        sorted.reverse();
    }

    const filteredByCategory = !category
        ? sorted
        : sorted.filter(x => x.category === category);

    const filtered =
        search.trim().length === 0
            ? filteredByCategory
            : searchComestibles(
                  filteredByCategory,
                  search,
                  Number.MAX_VALUE
              ).map(x => x.comestible);

    return (
        <div className="config">
            <input
                placeholder="filter"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <br />
            <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="alpha">Sort alphabetically</option>
                <option value="latest">Sort latest first</option>
                <option value="calories">Sort by calories</option>
                <option value="category">Sort by category</option>
                <option value="eaten">Sort by last eaten</option>
                <option value="satch">Sort by satch</option>
            </select>
            <select
                value={descending ? "desc" : "asc"}
                onChange={e => setDescending(e.target.value === "desc")}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
            </select>
            <select
                className="category"
                value={category}
                onChange={e => setCategory(e.target.value)}>
                <option key={""} value="">
                    All
                </option>
                {categories.map(cat => (
                    <option key={cat}>{cat}</option>
                ))}
            </select>
            {filtered.map(c => (
                <div
                    key={c.id}
                    className={`comestible${
                        c.redMeat
                            ? " red-meat"
                            : c.sugar
                            ? " sugar"
                            : c.alcohol
                            ? " alcohol"
                            : ""
                    }`}>
                    <div>
                        <span className="name">{c.label}</span>
                        <span className="component">⚡️ {c.calories} kCal</span>
                        {!!c.redMeat && (
                            <span className="component">🥩 {c.redMeat}g</span>
                        )}
                        {!!c.sugar && (
                            <span className="component">🦷 {c.sugar}g</span>
                        )}
                        {!!c.alcohol && (
                            <span className="component">🍺 {c.alcohol}u</span>
                        )}
                        {!!c.satch && (
                            <span className="component">💔 {c.satch}g</span>
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
                                setCalories(`${c.calories ?? 0}`);
                                setRedMeat(`${c.redMeat ?? 0}`);
                                setSugar(`${c.sugar ?? 0}`);
                                setAlcohol(`${c.alcohol ?? 0}`);
                                setSatch(`${c.satch ?? 0}`);
                                setName(c.label);
                                setEditing(c.id);
                            }}>
                            Edit
                        </button>
                    )}
                    {editing === c.id && (
                        <div className="editing">
                            <div>
                                <input
                                    className="name"
                                    placeholder="Name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label>⚡️</label>
                                <input
                                    type="number"
                                    className="calories"
                                    placeholder="Calories"
                                    value={calories}
                                    onChange={e => setCalories(e.target.value)}
                                />
                                kCal
                            </div>
                            <div>
                                <label>🥩</label>
                                <input
                                    type="number"
                                    className="red-meat"
                                    placeholder="Red meat"
                                    value={redMeat}
                                    onChange={e => setRedMeat(e.target.value)}
                                />
                                g
                            </div>
                            <div>
                                <label>🦷</label>
                                <input
                                    type="number"
                                    className="sugar"
                                    placeholder="Sugar"
                                    value={sugar}
                                    onChange={e => setSugar(e.target.value)}
                                />
                                g
                            </div>
                            <div>
                                <label>🍺</label>
                                <input
                                    type="number"
                                    className="alcohol"
                                    placeholder="Alcohol"
                                    value={alcohol}
                                    onChange={e => setAlcohol(e.target.value)}
                                />
                                units
                            </div>
                            <div>
                                <label>💔</label>
                                <input
                                    type="number"
                                    className="sugar"
                                    placeholder="Satch"
                                    value={satch}
                                    onChange={e => setSatch(e.target.value)}
                                />
                                g
                            </div>
                            <div>
                                <button
                                    disabled={
                                        isNaN(parseFloat(calories)) ||
                                        isNaN(parseFloat(redMeat)) ||
                                        isNaN(parseFloat(sugar)) ||
                                        isNaN(parseFloat(alcohol)) ||
                                        isNaN(parseFloat(satch))
                                    }
                                    onClick={() => {
                                        dispatch({
                                            type: "CONFIGURE_COMESTIBLE",
                                            comestible: editing,
                                            calories: parseFloat(calories),
                                            redMeat: parseFloat(redMeat),
                                            sugar: parseFloat(sugar),
                                            alcohol: parseFloat(alcohol),
                                            satch: parseFloat(satch),
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
                        {(daysByComestible[c.id] ?? []).slice(0, 8).map(x => (
                            <span
                                className="ate"
                                key={x}
                                onClick={() => {
                                    dispatch({
                                        type: "SET_EDITING_DATE",
                                        date: x,
                                    });
                                    showEditingDay();
                                }}>
                                {x}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
