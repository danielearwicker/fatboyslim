import React, { memo, useMemo, useState } from "react";
import {
    Day,
    FatboyData,
    Meal,
    probabilityOfAGivenB,
    searchComestibles,
} from "./data";
import { FatboyAction } from "./reducer";

export type AddComestibleProps = Readonly<{
    day: Day;
    meal: Meal;
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
}>;

export function mostOftenEatenWith(
    state: FatboyData,
    meal: Meal,
    ate: string[]
) {
    const candidates = state.comestibles
        .filter(x => !ate.includes(x.name))
        .map(comestible => ({
            comestible,
            probability: probabilityOfAGivenB(state.days, day => ({
                a: day.ate.some(
                    x => x.comestible === comestible.name && x.meal === meal
                ),
                b: ate.every(y =>
                    day.ate.some(x => x.comestible === y && x.meal === meal)
                ),
            })),
        }));

    candidates.sort((l, r) => r.probability - l.probability);

    return candidates.filter(x => x.probability > 0);
}

export const AddComestible = memo(
    ({ day, meal, state, dispatch }: AddComestibleProps) => {
        const [search, setSearch] = useState("");
        const [calories, setCalories] = useState("");

        const ate = useMemo(
            () => day.ate.filter(a => a.meal === meal).map(a => a.comestible),
            [day.ate]
        );

        const mealChoices = useMemo(
            () => mostOftenEatenWith(state, meal, ate),
            [state, meal, ate]
        );

        const found = (
            search.trim().length > 0
                ? searchComestibles(
                      state.comestibles.filter(x => !ate.includes(x.name)),
                      search
                  )
                : mealChoices
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
                                comestible: c.comestible.name,
                            });
                            reset();
                        }}>
                        <span className="calories">
                            {c.comestible.calories}
                        </span>
                        <span className="name">{c.comestible.name}</span>
                        {!!c.probability && (
                            <span className="probability">
                                {(c.probability * 100).toFixed(0)}%
                            </span>
                        )}
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
                                    comestible: found[0].comestible.name,
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
