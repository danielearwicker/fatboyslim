import {
    addDays,
    categories,
    dateDiff,
    FatboyData,
    getComestibleMap,
    getDayFacts,
    getFacts,
    sum,
    today,
} from "./data";
import { chain as _ } from "underscore";
import { StackedBar } from "./StackedBar";
import { NumberStat } from "./NumberStat";
import { useState } from "react";

export interface StatsProps {
    state: FatboyData;
}

export function Stats({ state }: StatsProps) {
    const comestibles = getComestibleMap(state);

    const [startDate, setStartDate] = useState(addDays(today(), -27));
    const [endDate, setEndDate] = useState(today());

    const filteredState = {
        ...state,
        days: state.days.filter(
            d =>
                (!startDate || dateDiff(startDate, d.date) >= 0) &&
                (!endDate || dateDiff(endDate, d.date) <= 0)
        ),
    };

    const facts = getFacts(filteredState, comestibles);
    const totalCalories = sum(facts.map(x => x.calories));
    const totalRedMeat = sum(facts.map(x => x.redMeat ?? 0));
    const dayCount = filteredState.days.length || 1;

    return (
        <div className="stats">
            <div className="filters">
                <span>from</span>
                <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />
                <span>to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                />
            </div>
            <div className="stat-box">
                <NumberStat value={filteredState.days.length} label="days" />
                <NumberStat value={totalCalories / dayCount} label="cal/day" />
                <NumberStat
                    value={totalRedMeat / dayCount}
                    label="red meat (g)"
                />
            </div>

            <StackedBar
                title="history"
                sort="bar"
                source={filteredState.days.flatMap(day =>
                    getDayFacts(day, comestibles).map(fact => ({
                        bar: day.date,
                        segment: fact.meal,
                        value: fact.calories,
                    }))
                )}
            />

            <StackedBar
                title="red meat (g)"
                sort="bar"
                source={filteredState.days.flatMap(day =>
                    getDayFacts(day, comestibles).map(fact => ({
                        bar: day.date,
                        segment: fact.comestible,
                        value: fact.redMeat,
                    }))
                )}
            />

            <StackedBar
                title="comestibles (calories)"
                source={facts.map(x => ({
                    bar: x.comestible,
                    segment: x.meal,
                    value: x.calories / dayCount,
                }))}
            />

            <StackedBar
                title="comestibles (per week)"
                source={facts.map(x => ({
                    bar: x.comestible,
                    segment: x.meal,
                    value: 7 / dayCount,
                }))}
            />

            <StackedBar
                title="meals"
                source={facts.map(x => ({
                    bar: x.meal,
                    segment: "calories",
                    value: x.calories / dayCount,
                }))}
            />

            <StackedBar
                title="categories"
                source={facts.map(x => ({
                    bar: x.category,
                    segment: x.comestible,
                    value: x.calories / dayCount,
                }))}
            />

            {categories.map(category => (
                <StackedBar
                    key={category}
                    title={category}
                    source={facts
                        .filter(x => x.category === category)
                        .map(x => ({
                            bar: x.comestible,
                            segment: x.meal,
                            value: x.calories / dayCount,
                        }))}
                />
            ))}
        </div>
    );
}
