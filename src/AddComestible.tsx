import React, { memo, useMemo, useState } from "react";
import {
    Comestible,
    dateDiff,
    Day,
    FatboyData,
    getComestibleMap,
    Meal,
    searchComestibles,
    sortComestibleChoices,
} from "./data";
import { FatboyAction } from "./reducer";

export type AddComestibleProps = Readonly<{
    day: Day;
    meal: Meal;
    state: FatboyData;
    limit: number;
    dispatch: React.Dispatch<FatboyAction>;
}>;

export function mostOftenEatenWith(
    state: FatboyData,
    meal: Meal,
    ate: string[],
    day: string,
    limit: number
) {
    const lastConsumed: Record<string, string[]> = {};

    for (const d of state.days) {
        for (const a of d.ate) {
            if (a.meal === meal) {
                const lc =
                    lastConsumed[a.comestible] ??
                    (lastConsumed[a.comestible] = []);
                if (lc.length === 10) {
                    lc.shift();
                }
                lc.push(d.date);
            }
        }
    }

    const frequencies: { comestible: Comestible; hits: number }[] = [];

    for (const [comestible, lc] of Object.entries(lastConsumed)) {
        let hits = 0;
        if (lc.length > 1) {
            const last = lc.length - 1;
            const daysToNow = Math.abs(dateDiff(lc[last], day));
            for (let n = 0; n < last; n++) {
                const daysBetween = dateDiff(lc[n], lc[n + 1]);
                if (daysToNow % daysBetween === 0) {
                    hits += 1 / (daysToNow / daysBetween);
                }
            }
        }

        if (hits > 0) {
            frequencies.push({
                comestible: state.comestibles.find(c => c.id === comestible)!,
                hits,
            });
        }
    }

    const rightAboutNow = frequencies
        .slice(0, 8)
        .map(x => ({
            comestible: x.comestible,
            weight: x.hits,
        }))
        .filter(x => x.weight > 0);

    const eatenToday: { [id: string]: boolean } = {};

    for (const a of ate) {
        eatenToday[a] = true;
    }

    const network: {
        [id: string]: number;
    } = {};

    for (const day of state.days) {
        for (const eatenThen of day.ate) {
            if (eatenThen.meal === meal && eatenToday[eatenThen.comestible]) {
                for (const eatenThenOther of day.ate) {
                    if (
                        eatenThenOther.meal === meal &&
                        !eatenToday[eatenThenOther.comestible]
                    ) {
                        network[eatenThenOther.comestible] =
                            (network[eatenThenOther.comestible] ?? 0) + 1;
                    }
                }
            }
        }
    }

    const comestiblesMap = getComestibleMap(state);

    const suggestions = Object.entries(network).map(([id, weight]) => ({
        id,
        weight,
    }));
    suggestions.sort((l, r) => r.weight - l.weight);

    const implied = suggestions.slice(0, 5).map(x => ({
        comestible: comestiblesMap[x.id],
        weight: x.weight,
    }));

    const extras = state.comestibles.filter(
        x => x.calories < limit && x.category == "treat" && !ate.includes(x.id)
    );
    extras.sort((l, r) => r.calories - l.calories);
    const topExtras = extras.slice(0, 5).map(comestible => ({
        weight: 1,
        comestible,
    }));

    const candidates =
        ate.length === 0
            ? rightAboutNow
            : implied.length !== 0
            ? implied
            : topExtras;

    sortComestibleChoices(candidates, limit);

    return candidates;
}

export const AddComestible = memo(
    ({ day, meal, limit, state, dispatch }: AddComestibleProps) => {
        const [search, setSearch] = useState("");
        const [calories, setCalories] = useState("");

        const ate = useMemo(
            () => day.ate.filter(a => a.meal === meal).map(a => a.comestible),
            [day.ate]
        );

        const mealChoices = useMemo(
            () => mostOftenEatenWith(state, meal, ate, day.date, limit),
            [state, meal, ate, day.date]
        );

        const found = (
            search.trim().length > 0
                ? searchComestibles(
                      state.comestibles.filter(x => !ate.includes(x.id)),
                      search,
                      limit
                  )
                : mealChoices
        ).slice(0, 10);

        function reset() {
            setSearch("");
            setCalories("");
        }

        return (
            <>
                {found.map(c => (
                    <div
                        key={c.comestible.id}
                        className={`comestible addable${
                            c.comestible.calories > limit ? " too-much" : ""
                        }`}
                        onClick={() => {
                            dispatch({
                                type: "ADD_ATE",
                                meal,
                                comestible: c.comestible.id,
                                quantity: 1,
                            });
                            reset();
                        }}>
                        {!!c.comestible.sugar && <span>🦷</span>}
                        {!!c.comestible.satch && <span>💔</span>}
                        {!!c.comestible.redMeat && <span>🥩</span>}
                        {!!c.comestible.alcohol && <span>🍺</span>}
                        <span className="calories">
                            {c.comestible.calories}
                        </span>
                        <span className="name">{c.comestible.label}</span>
                        {!!c.weight && (
                            <span className="weight">
                                {c.weight.toFixed(2)}
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
                                    satch: 0,
                                    alcohol: 0,
                                    sugar: 0,
                                    meal,
                                });
                                reset();
                            } else if (found.length > 0) {
                                dispatch({
                                    type: "ADD_ATE",
                                    meal,
                                    comestible: found[0].comestible.id,
                                    quantity: 1,
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
