import { memo, useEffect, useMemo, useReducer, useState } from "react";
import { DiscreteColorLegend, HorizontalBarSeries, HorizontalGridLines, VerticalGridLines, XAxis, XYPlot, YAxis, YAxisProps } from "react-vis";
import { AddComestible } from "./AddComestible";
import { Comestible, FatboyData, meals } from "./data";
import { DatePicker } from "./DatePicker";
import { MealContents } from "./MealContents";
import { ProgressBar } from "./ProgressBar";
import { fatboyReducer } from "./reducer";
import { SlimStorage } from "./storage";

export interface StatsProps {
  state: FatboyData;
  comestibles: Map<string, Readonly<Comestible>>;
}

export function Stats({ state, comestibles }: StatsProps) {
  const statsByComestible: { 
    [name: string]: {
      calories: number;
      appearances: number;
    }
  } = {};

  for (const d of state.days) {
    for (const c of d.ate) {
      const lookedUp = comestibles.get(c.comestible);
      if (lookedUp) {
        const s = statsByComestible[c.comestible] ?? (statsByComestible[c.comestible] = {
          calories: 0,
          appearances: 0,
        });
        s.appearances++;
        s.calories += lookedUp.calories;
      }
    }
  }

  const statsByComestibleAr = Object.entries(statsByComestible)
    .map(([name, stats]) => ({ name, stats }));

  statsByComestibleAr.sort((l, r) => r.stats.appearances - l.stats.appearances);

  const mostPopularComestibles = statsByComestibleAr.slice(0, 20);
  mostPopularComestibles.reverse();

  statsByComestibleAr.sort((l, r) => r.stats.calories - l.stats.calories);

  const mostCaloriesComestibles = statsByComestibleAr.slice(0, 20);
  mostCaloriesComestibles.reverse();

  return (
    <>
    <div className="stat-box">  
    <DiscreteColorLegend orientation="horizontal" height={50} width={400} items={meals.map(title => ({ title }))} />    
      <XYPlot width={400} height={300} stackBy="x" margin={{left: 80, right: 10, top: 10, bottom: 40}}>
        <VerticalGridLines />
        <HorizontalGridLines />
        <XAxis/>
        <YAxis tickFormat={t => state.days[t].date}/>
        {
          meals.map(m => (
            <HorizontalBarSeries key={m} barWidth={0.5} data={
              state.days.map((d, i) => (
                {
                  y: i, 
                  x: d.ate.filter(a => a.meal === m)
                          .map(a => comestibles.get(a.comestible)?.calories ?? 0)
                          .reduce((l, r) => l + r, 0)
                }
              ))} />
          ))
        }        
      </XYPlot>
    </div>
    <div className="stat-box">      
      <XYPlot width={400} height={500} margin={{left: 150, right: 10, top: 10, bottom: 40}}>
        <VerticalGridLines />
        <HorizontalGridLines />
        <XAxis/>
        <YAxis tickTotal={mostCaloriesComestibles.length} tickFormat={t => mostCaloriesComestibles[t].name}/>
        <HorizontalBarSeries barWidth={0.8} data={
          mostCaloriesComestibles.map((c, i) => (
            {
              y: i, 
              x: c.stats.calories
            }
          ))} />
      </XYPlot>
    </div>
    </>
  )
}
