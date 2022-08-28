import React, { useState } from "react";
import { Day, FatboyData, Meal } from "./data";
import { FatboyAction } from "./reducer";
import "./styles.scss";

export type AddComestibleProps = Readonly<{
  day: Day;
  meal: Meal;
  state: FatboyData;
  dispatch: React.Dispatch<FatboyAction>;
}>;

export function AddComestible({
  day,
  meal,
  state,
  dispatch
}: AddComestibleProps) {
  const [search, setSearch] = useState("");
  const [calories, setCalories] = useState("");

  const ate = day.ate.filter((a) => a.meal === meal).map((a) => a.comestible);

  const found =
    search.length === 0
      ? []
      : state.comestibles
          .filter(
            (x) =>
              !ate.includes(x.name) &&
              search.toLowerCase().split(" ").every(part => 
                x.name.toLowerCase().includes(part))
          )
          .map(x => ({
            match: x,
            score: search.toLowerCase() === x.name ? 1 : 0
          }))
          .sort((l, r) => r.score - l.score)
          .map(x => x.match)
          .slice(0, 5);

  function reset() {
    setSearch("");
    setCalories("");
    setTimeout(() => {
      (document.querySelector(`.${meal} .search`) as HTMLElement).focus();
    }, 1);
  }

  return (
    <>
      {found.map((c) => (
        <div
          className="comestible addable"
          onClick={() => {
            dispatch({
              type: "ADD_ATE",
              meal,
              comestible: c.name
            });
            reset();
          }}
        >
          <span className="calories">{c.calories}</span>
          <span className="name">{c.name}</span>
        </div>
      ))}
      <div className={`add-comestible ${meal}`}>
        <form onSubmit={e => {
            e.preventDefault();
            const caloriesNumber = parseFloat(calories);
            if (!isNaN(caloriesNumber) && !!search) {
              dispatch({
                type: "ADD_COMESTIBLE",
                name: search,
                calories: parseFloat(calories)
              });
              dispatch({
                type: "ADD_ATE",
                meal,
                comestible: search
              });
              reset();
            } else if (found.length > 0) {
              dispatch({
                type: "ADD_ATE",
                meal,
                comestible: found[0].name
              });
              reset();
            }
          }}>
          <input
            className="search"
            placeholder="Comestible"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            className="calories"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
          <button type="submit" disabled={(isNaN(parseFloat(calories)) || !search) && found.length === 0}>
            Add
          </button>
        </form>
      </div>
    </>
  );
}
