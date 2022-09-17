import React, { memo, useMemo, useState } from "react";
import { Comestible, Day, FatboyData, Meal, searchComestibles } from "./data";
import { FatboyAction } from "./reducer";

export type AddComestibleProps = Readonly<{
    day: Day;
    meal: Meal;
    comestibles: Record<string, Comestible>;
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
}>;

function increment(obj: { [key: string]: number }, key: string, by: number) {
    obj[key] = (obj[key] ?? 0) + by;
}

export function mostOftenEatenWith(
    days: readonly Day[],
    meal: Meal,
    ate: string[]
) {
    const occurrences: { [comestible: string]: number } = {};

    for (const d of days) {
        for (const a of d.ate) {
            if (a.meal === meal) {
                increment(occurrences, a.comestible, 1);
            }
        }
    }

    // So occurrences[c] / days.length tells you on what proportion
    // of all days this meal includes c. Reciprocal of that is the
    // rarity of a meal, which boosts its significance as a match.

    const popular: { [comestible: string]: number } = {};

    const ateSet = Object.fromEntries(ate.map(a => [a, true]));

    for (const d of days) {
        let score = 0.001;

        for (const a of d.ate) {
            if (a.meal === meal) {
                if (ateSet[a.comestible]) {
                    score += days.length / occurrences[a.comestible];
                }
            }
        }

        for (const a of d.ate) {
            if (a.meal === meal && !ateSet[a.comestible]) {
                increment(popular, a.comestible, score);
            }
        }
    }

    const entries = Object.entries(popular);
    entries.sort((l, r) => r[1] - l[1]);
    const result = entries.map(x => x[0]);

    for (const r of result.slice(0, 5)) {
        console.log(r, popular[r]);
    }

    return result;
}

export const AddComestible = memo(
    ({ day, meal, comestibles, state, dispatch }: AddComestibleProps) => {
        const [search, setSearch] = useState("");
        const [calories, setCalories] = useState("");

        const ate = useMemo(
            () => day.ate.filter(a => a.meal === meal).map(a => a.comestible),
            [day.ate]
        );

        const mealChoices = useMemo(
            () => mostOftenEatenWith(state.days, meal, ate),
            [state.days, meal, ate]
        );

        const found = (
            search.trim().length > 0
                ? searchComestibles(state.comestibles, search, x =>
                      ate.includes(x)
                  )
                : mealChoices.map(x => comestibles[x])
        ).slice(0, 10);

        function reset() {
            setSearch("");
            setCalories("");
            setTimeout(() => {
                (
                    document.querySelector(`.${meal} .search`) as HTMLElement
                ).focus();
            }, 1);
        }

        return (
            <>
                {found.map(c => (
                    <div
                        className="comestible addable"
                        onClick={() => {
                            dispatch({
                                type: "ADD_ATE",
                                meal,
                                comestible: c.name,
                            });
                            reset();
                        }}>
                        <span className="calories">{c.calories}</span>
                        <span className="name">{c.name}</span>
                    </div>
                ))}
                <div className={`add-comestible ${meal}`}>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            const caloriesNumber = parseFloat(calories);
                            if (!isNaN(caloriesNumber) && !!search) {
                                dispatch({
                                    type: "ADD_COMESTIBLE",
                                    name: search,
                                    calories: parseFloat(calories),
                                    category: "other",
                                    redMeat: 0,
                                });
                                dispatch({
                                    type: "ADD_ATE",
                                    meal,
                                    comestible: search,
                                });
                                reset();
                            } else if (found.length > 0) {
                                dispatch({
                                    type: "ADD_ATE",
                                    meal,
                                    comestible: found[0].name,
                                });
                                reset();
                            }
                        }}>
                        <input
                            className="search"
                            placeholder="Comestible"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <input
                            className="calories"
                            placeholder="Calories"
                            value={calories}
                            onChange={e => setCalories(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={
                                (isNaN(parseFloat(calories)) || !search) &&
                                found.length === 0
                            }>
                            Add
                        </button>
                    </form>
                </div>
            </>
        );
    }
);
