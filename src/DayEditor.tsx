import { useMemo } from "react";
import { AddComestible } from "./AddComestible";
import { FatboyData, getComestibleMap, getFacts, meals, sum } from "./data";
import { DatePicker } from "./DatePicker";
import { MealContents } from "./MealContents";
import { alreadyPlanned, dailyLimit, ProgressBar } from "./ProgressBar";
import { FatboyAction } from "./reducer";
import { chain as _ } from "underscore";

export interface DayEditorProps {
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
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

    const total = alreadyPlanned(ate);
    const remaining = Math.max(dailyLimit - total);

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
            <ProgressBar total={total} />
            <div className="day">
                {!existingDay && <p>It's a brand new day!</p>}
                {byMeal.map(m => (
                    <MealContents
                        key={m.meal}
                        meal={m.meal}
                        ate={m.ate}
                        stats={{ caloriesAverage: averageMeal[m.meal] }}
                        limit={remaining}
                        dispatch={dispatch}>
                        <AddComestible
                            key={`${m.meal}_add_comestible`}
                            day={day}
                            meal={m.meal}
                            limit={remaining}
                            state={state}
                            dispatch={dispatch}
                        />
                    </MealContents>
                ))}
            </div>
        </>
    );
}
