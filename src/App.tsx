import produce from "immer";
import React, { useReducer, useState } from "react";
import { chain as _ } from "underscore";
import "./styles.scss";

type Comestible = Readonly<{
  name: string;
  calories: number;
}>;

const meals = ["breakfast", "lunch", "tea", "pud"] as const;

type Meal = typeof meals[number];

type Ate = Readonly<{
  comestible: string;
  meal: Meal;
  quantity: number;
}>;

function today(): string {
  return new Date().toISOString().substring(0, 11);
}

type Day = Readonly<{
  date: string;
  ate: Ate[];
}>;

type FatboyData = Readonly<{
  comestibles: readonly Comestible[];
  days: readonly Day[];
  editingDay: string;
}>;

type FatboyAction =
  | {
      type: "SET_EDITING_DATE";
      date: string;
    }
  | {
      type: "TODAY";
    }
  | {
      type: "DELETE_ATE";
      meal: Meal;
      comestible: string;
    }
  | {
      type: "ADD_ATE";
      meal: Meal;
      comestible: string;
    }
  | {
      type: "ADD_COMESTIBLE";
      name: string;
      calories: number;
    };

function fatboyReducer(data: FatboyData, action: FatboyAction) {
  switch (action.type) {
    case "SET_EDITING_DATE":
      return produce(data, (draft) => {
        draft.editingDay = action.date;
      });
    case "TODAY":
      return produce(data, (draft) => {
        draft.editingDay = today();
      });
    case "DELETE_ATE":
      return produce(data, (draft) => {
        const dayAt = draft.days.findIndex((x) => x.date === draft.editingDay);
        if (dayAt === -1) return;

        const day = draft.days[dayAt];
        const ateAt = day.ate.findIndex(
          (x) => x.meal === action.meal && x.comestible === action.comestible
        );
        if (ateAt === -1) return;

        const ate = day.ate[ateAt];
        ate.quantity--;

        if (ate.quantity > 0) return;

        day.ate.splice(ateAt, 1);

        if (!day.ate.length) {
          draft.days.splice(dayAt, 1);
        }
      });
    case "ADD_ATE":
      return produce(data, (draft) => {
        let day = draft.days.find((x) => x.date === draft.editingDay);
        if (!day) {
          day = { date: draft.editingDay, ate: [] };
          draft.days.push(day);
        }

        let ate = day.ate.find(
          (x) => x.meal === action.meal && x.comestible === action.comestible
        );
        if (!ate) {
          ate = {
            meal: action.meal,
            comestible: action.comestible,
            quantity: 0
          };
          day.ate.push(ate);
        }

        ate.quantity++;
      });
    case "ADD_COMESTIBLE":
      return produce(data, (draft) => {
        if (
          !draft.comestibles.find(
            (c) => c.name.toLowerCase() === action.name.toLowerCase()
          )
        ) {
          draft.comestibles.push({
            name: action.name,
            calories: action.calories
          });
        }
      });
  }

  const catchAll: never = action;
  throw new Error(`Unrecognised action ${JSON.stringify(catchAll)}`);
}

const initialState: FatboyData = {
  comestibles: [
    { name: "Weetabix", calories: 66 },
    { name: "Milk 250ml", calories: 125 }
  ],
  days: [
    {
      date: "2022-08-21",
      ate: [
        { comestible: "Weetabix", meal: "breakfast", quantity: 3 },
        { comestible: "Milk 250ml", meal: "breakfast", quantity: 1 }
      ]
    }
  ],
  editingDay: "2022-08-27"
};

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
              x.name.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 3);

  return (
    <>
      {found.map((c) => (
        <div
          className="comestible addable"
          onClick={() =>
            dispatch({
              type: "ADD_ATE",
              meal,
              comestible: c.name
            })
          }
        >
          <span className="calories">{c.calories}</span>
          <span className="name">{c.name}</span>
        </div>
      ))}
      <div className="add-comestible">
        <input
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
        <button
          onClick={() => {
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
          }}
        >
          Add
        </button>
      </div>
    </>
  );
}

const dailyLimit = 1800;

export function FatboySlim() {
  const [state, dispatch] = useReducer(fatboyReducer, initialState);

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
            <div className="meal">
              <div className="meal-heading">{m.meal}</div>
              <div className="ate">
                {m.ate.map((c) => (
                  <div className="comestible">
                    <span className="calories">{c.calories}</span>
                    <span className="name">{c.name}</span>
                    <span
                      className="quantity"
                      onClick={() =>
                        dispatch({
                          type: "ADD_ATE",
                          meal: m.meal,
                          comestible: c.name
                        })
                      }
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

export default function App() {
  return (
    <div className="App">
      <FatboySlim />
    </div>
  );
}
