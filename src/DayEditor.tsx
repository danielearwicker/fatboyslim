import { useMemo } from "react";
import { AddComestible } from "./AddComestible";
import { FatboyData, getComestibleMap, getFacts, meals, sum } from "./data";
import { DatePicker } from "./DatePicker";
import { MealContents } from "./MealContents";
import { ProgressBar } from "./ProgressBar";
import { chain as _ } from "underscore";
import { FatboyDispatch } from "./fatboyMethods";

export interface DayEditorProps {
    state: FatboyData;
    dispatch: FatboyDispatch;
}

export function DayEditor({ state, dispatch }: DayEditorProps) {
    const existingDay = useMemo(
        () => state.days.find(x => x.date === state.editingDay),
        [state.days, state.editingDay]
    );

    const day = existingDay ?? {
        date: state.editingDay,
        ate: [],
    };

    const comestibles = getComestibleMap(state);

    const ate = day.ate
        .map(x => ({
            meal: x.meal,
            comestible: comestibles[x.comestible]!,
            quantity: x.quantity,
        }))
        .filter(x => !!x.comestible);

    const byMeal = useMemo(
        () =>
            meals.map(m => ({
                meal: m,
                ate: ate
                    .filter(a => a.meal === m)
                    .map(a => ({ ...a.comestible, quantity: a.quantity })),
            })),
        [meals, ate]
    );

    const facts = getFacts(state, comestibles);

    const averageMeal = _(facts)
        .groupBy(x => x.meal)
        .mapObject(g => sum(g.map(x => x.calories)) / (state.days.length || 1))
        .value();

    return (
        <>
            <DatePicker value={state.editingDay} dispatch={dispatch} />
            <div className="day">
                {!existingDay && <p>It's a brand new day!</p>}
                <ProgressBar ate={ate} />
                {byMeal.map(m => (
                    <MealContents
                        key={m.meal}
                        meal={m.meal}
                        ate={m.ate}
                        stats={{ caloriesAverage: averageMeal[m.meal] }}
                        dispatch={dispatch}>
                        <AddComestible
                            day={day}
                            meal={m.meal}
                            state={state}
                            dispatch={dispatch}
                        />
                    </MealContents>
                ))}
            </div>
        </>
    );
}
