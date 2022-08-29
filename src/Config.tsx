import { useState } from "react";
import { categories, Category, FatboyData, searchComestibles } from "./data";
import { FatboyAction } from "./reducer";

export interface ConfigProps {
  state: FatboyData;
  dispatch: React.Dispatch<FatboyAction>;
}

export function Config({ state, dispatch }: ConfigProps) {
  const [search, setSearch] = useState("");

  const sorted = state.comestibles.slice(0);
  sorted.sort((l, r) => l.name.localeCompare(r.name));

  const filtered = search.trim().length === 0
    ? sorted
    : searchComestibles(sorted, search, x => false);

  return (
    <div className="config">
      <input placeholder="filter" value={search} onChange={e => setSearch(e.target.value)} />
      {
        filtered.map(c => (
          <div key={c.name} className="comestible">
            <div className="name">{c.name}</div>
            <select className="category" value={c.category} onChange={e => dispatch({
              type: "SET_CATEGORY",
              comestible: c.name,
              category: e.target.value as Category
            })}>
              {categories.map(cat => <option key={cat}>{cat}</option>)}              
            </select>
          </div>
        ))
      }
    </div>
  );
}
