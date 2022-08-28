import { useEffect, useReducer, useState } from "react";
import { AddComestible } from "./AddComestible";
import { FatboyData, meals } from "./data";
import { fatboyReducer } from "./reducer";
import { SlimStorage } from "./storage";
import "./styles.scss";

const initialState: FatboyData = {
  comestibles: [],
  days: [],
  editingDay: "2022-08-27"
};

const dailyLimit = 1800;

export interface FatboySlimProps {
  storage: SlimStorage
}

export function FatboySlim({ storage }: FatboySlimProps) {
  const [state, dispatchWithoutSave] = useReducer(fatboyReducer, initialState);

  useEffect(() => {
    async function load() {      
      try {
        const config = await storage.load();
        dispatchWithoutSave({ type: "LOAD", config });          
      } catch (e) {
        console.error(e);
      }
    }

    load();
  }, []);

  const [shouldSave, setShouldSave] = useState(false);

  const dispatch: typeof dispatchWithoutSave = a => {
    dispatchWithoutSave(a);
    setShouldSave(true);
  }

  useEffect(() => {
    if (shouldSave) {
      setShouldSave(false);
      storage.saveSoon(state);      
    }
  }, [shouldSave]);

  const existingDay = state.days.find((x) => x.date === state.editingDay);
  const day = existingDay ?? {
    date: state.editingDay,
    ate: []
  };

  const ate = day.ate
    .map((x) => ({
      meal: x.meal,
      comestible: state.comestibles.find((c) => c.name === x.comestible)!,
      quantity: x.quantity
    }))
    .filter((x) => !!x.comestible);

  const total = ate
    .map((a) => a.comestible.calories * a.quantity)
    .reduce((l, r) => l + r, 0);

  const progress = (100 * total) / dailyLimit;

  const byMeal = meals.map((m) => ({
    meal: m,
    ate: ate
      .filter((a) => a.meal === m)
      .map((a) => ({ ...a.comestible, quantity: a.quantity }))
  }));

  return (
    <div className="fatboy-slim">
      <div className="date-picker">
        <input
          type="date"
          value={state.editingDay}
          onChange={(e) =>
            dispatch({
              type: "SET_EDITING_DATE",
              date: e.target.value
            })
          }
        />
        <button onClick={() => dispatch({ type: "TODAY" })}>today</button>
        <div className="day">
          {!existingDay && <p>It's a brand new day!</p>}
          {total > dailyLimit ? (
            <h2 className="over-the-limit">
              You are {total - dailyLimit} ({Math.round(progress - 100)}%) over
              your limit!
            </h2>
          ) : (
            <div className="calorie-bar">
              <div className="progress" style={{ width: `${progress}%` }} />
              <div className="ate">{total}</div>
              <div className="remaining">{dailyLimit - total}</div>
            </div>
          )}

          {byMeal.map((m) => (
            <div key={m.meal} className="meal">
              <div className="meal-heading">{m.meal}</div>
              <div className="ate">
                {m.ate.map((c) => (
                  <div key={c.name} className="comestible">
                    <span className="calories">{c.calories}</span>
                    <span className="name">{c.name}</span>
                    <span
                      className="quantity"
                      onClick={() => {
                        dispatch({
                          type: "ADD_ATE",
                          meal: m.meal,
                          comestible: c.name
                        });
                      }}
                    >
                      {c.quantity > 1 ? `x${c.quantity}` : "+"}
                    </span>

                    <span
                      className="delete"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_ATE",
                          meal: m.meal,
                          comestible: c.name
                        })
                      }
                    >
                      🗑
                    </span>
                  </div>
                ))}
              </div>
              <AddComestible
                key={`add-${day.ate.length}`}
                day={day}
                meal={m.meal}
                state={state}
                dispatch={dispatch}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
