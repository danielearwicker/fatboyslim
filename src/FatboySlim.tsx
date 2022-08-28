import { memo, useEffect, useMemo, useReducer, useState } from "react";
import { HorizontalBarSeries, HorizontalGridLines, VerticalGridLines, XAxis, XYPlot, YAxis } from "react-vis";
import { AddComestible } from "./AddComestible";
import { Comestible, FatboyData, meals } from "./data";
import { DatePicker } from "./DatePicker";
import { MealContents } from "./MealContents";
import { ProgressBar } from "./ProgressBar";
import { fatboyReducer } from "./reducer";
import { Stats } from "./Stats";
import { SlimStorage } from "./storage";


export interface FatboySlimProps {
  storage: SlimStorage
}

export const FatboySlim = memo(({ storage }: FatboySlimProps) => {
  const { dispatch, state } = storage;

  const existingDay = useMemo(() => state.days.find((x) => x.date === state.editingDay), 
    [state.days, state.editingDay]);

  const day = existingDay ?? {
    date: state.editingDay,
    ate: []
  };

  const comestibleLookup = useMemo(() => new Map(state.comestibles.map(x => [x.name, x])), [state.comestibles]);

  const ate = useMemo(() => day.ate
    .map((x) => ({
      meal: x.meal,
      comestible: comestibleLookup.get(x.comestible)!,
      quantity: x.quantity
    }))
    .filter((x) => !!x.comestible), [day.ate, comestibleLookup]);

  const byMeal = useMemo(() => meals.map((m) => ({
    meal: m,
    ate: ate
      .filter((a) => a.meal === m)
      .map((a) => ({ ...a.comestible, quantity: a.quantity }))
  })), [meals, ate]);

  return (
    <div className="fatboy-slim">
      <DatePicker value={state.editingDay} dispatch={dispatch} />
    
      <div className="day">
        {!existingDay && <p>It's a brand new day!</p>}
        <ProgressBar ate={ate} />        
        {byMeal.map((m) => (
          <MealContents key={m.meal} meal={m.meal} ate={m.ate} dispatch={dispatch}>
            <AddComestible
              day={day}
              meal={m.meal}
              state={state}
              dispatch={dispatch}
            />
          </MealContents>
        ))}
      </div>
      <Stats state={state} comestibles={comestibleLookup}/>
    </div>
  );
});
