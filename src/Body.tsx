import { useState } from "react";
import { addDays, FatboyData, MeasurementType, measurementTypes } from "./data";
import { FatboyAction } from "./reducer";
import {
    LineSeries,
    MarkSeries,
    MarkSeriesPoint,
    VerticalGridLines,
    XAxis,
    XYPlot,
    YAxis,
} from "react-vis";
import { DatePicker } from "./DatePicker";

export interface BodyProps {
    state: FatboyData;
    dispatch: React.Dispatch<FatboyAction>;
}

export function Body({ state, dispatch }: BodyProps) {
    const [type, setType] = useState<MeasurementType>(measurementTypes[0]);

    const orderedDates = state.measurements.map(x => x.date);
    orderedDates.sort();

    const dates: string[] = [];

    const numbersByDate: { [date: string]: number } = {};

    if (orderedDates.length > 0) {
        const stopDate = addDays(orderedDates[orderedDates.length - 1], 1);
        for (let d = orderedDates[0]; d != stopDate; d = addDays(d, 1)) {
            numbersByDate[d] = dates.length;
            dates.push(d);
        }
    }

    const waistData = state.measurements
        .filter(m => m.type === "Waist/cm")
        .map(m => ({
            x: numbersByDate[m.date],
            y: m.value,
        }));

    const weightData = state.measurements
        .filter(m => m.type === "Weight/kg")
        .map(m => ({
            x: numbersByDate[m.date],
            y: m.value,
        }));

    function fetchValue(day: string, type: MeasurementType) {
        const m = state.measurements.find(
            x => x.date === day && x.type === type
        );
        return "" + (m?.value ?? "");
    }

    const [value, setValue] = useState(fetchValue(state.editingDay, type));

    function add() {
        if (!value) {
            dispatch({
                type: "REMOVE_MEASUREMENT",
                measurementType: type,
            });
        } else {
            dispatch({
                type: "ADD_MEASUREMENT",
                measurementType: type,
                value: parseFloat(value),
            });
        }
    }

    function dateTickFormat(numeric: number) {
        const date = new Date(dates[numeric]);
        const dom = date.getDate();
        if (dom == 1) {
            return date.toLocaleString("default", { month: "short" });
        }
        if (dom === 10 || dom === 20) {
            return `${dom}`;
        }
        return "";
    }

    function onClickPoint(point: MarkSeriesPoint) {
        const date = dates[point.x as number];
        dispatch({ type: "SET_EDITING_DATE", date });
        setValue(fetchValue(date, type));
    }

    const showData = type === "Waist/cm" ? waistData : weightData;

    return (
        <>
            <DatePicker value={state.editingDay} dispatch={dispatch} />
            <div className="measurements">
                <div className="entry">
                    <div className="type">
                        <select
                            value={type}
                            onChange={e =>
                                setType(e.target.value as MeasurementType)
                            }>
                            {measurementTypes.map(x => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>
                    <div className="value">
                        <input
                            type="number"
                            placeholder="Value"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                        />
                    </div>
                    <div className="buttons">
                        <button onClick={add}>Add</button>
                    </div>
                </div>
                <div className="history">
                    <XYPlot width={400} height={400}>
                        <VerticalGridLines />
                        <XAxis
                            tickFormat={dateTickFormat}
                            tickTotal={dates.length}
                        />
                        <YAxis />
                        <LineSeries data={showData} />
                        <MarkSeries
                            data={showData}
                            onValueClick={onClickPoint}
                        />
                    </XYPlot>
                </div>
            </div>
        </>
    );
}
