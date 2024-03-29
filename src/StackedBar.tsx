import {
    DiscreteColorLegend,
    Hint,
    HorizontalBarSeries,
    HorizontalBarSeriesPoint,
    VerticalGridLines,
    XAxis,
    XYPlot,
    YAxis,
} from "react-vis";
import { formatNumber, sum } from "./data";
import { chain as _ } from "underscore";
import { useState } from "react";

export interface StackedBarProps {
    title?: string;
    source: {
        bar: string;
        segment: string;
        value: number;
        date?: string;
    }[];
    segments?: string[];
    sort?: "bar" | "value";
}

export function StackedBar({
    title,
    source,
    segments,
    sort,
    children,
}: React.PropsWithChildren<StackedBarProps>) {
    segments ??= _(source)
        .filter(x => x.value > 0)
        .map(x => x.segment)
        .unique()
        .value();

    const bars =
        sort === "bar"
            ? _(source)
                  .map(s => s.bar)
                  .unique()
                  .sort()
                  .value()
            : _(source)
                  .groupBy(s => s.bar)
                  .pairs()
                  .map(([bar, group]) => ({
                      bar,
                      total: sum(group.map(s => s.value)),
                  }))
                  .filter(x => x.total > 0)
                  .sortBy(x => x.total)
                  .map(x => x.bar)
                  .value();

    const cells = _(source)
        .groupBy(s => `${s.bar}-${s.segment}`)
        .mapObject(g => {
            const dayCount =
                _(g)
                    .map(x => x.date)
                    .unique()
                    .value().length ?? 1;

            return sum(g.map(s => s.value)) / dayCount;
        })
        .value();

    const [hint, setHint] = useState<{
        point: HorizontalBarSeriesPoint;
        bar: string;
        segment: string;
        value: number;
    }>();

    return (
        <div className="stat-box">
            {title && <h3>{title}</h3>}
            <DiscreteColorLegend
                orientation="horizontal"
                height={50}
                width={400}
                items={segments}
            />
            <XYPlot
                width={400}
                height={50 + bars.length * 20}
                stackBy="x"
                margin={{ left: 150, right: 10, top: 10, bottom: 40 }}>
                <VerticalGridLines />
                <XAxis />
                <YAxis
                    tickTotal={bars.length}
                    tickFormat={t => bars[t] ?? ""}
                />
                {segments.map(segment => {
                    const data = bars.map((bar, i) => ({
                        y: i,
                        x: cells[`${bar}-${segment}`] ?? 0,
                    }));

                    if (data.every(d => d.x === 0)) {
                        return undefined;
                    }
                    return (
                        <HorizontalBarSeries
                            key={segment}
                            barWidth={0.8}
                            onValueMouseOver={point =>
                                setHint({
                                    point,
                                    segment,
                                    bar: bars[point.y as number],
                                    value: data[point.y as number].x,
                                })
                            }
                            onValueMouseOut={() => setHint(undefined)}
                            data={data}
                        />
                    );
                })}
                {children}
                {hint ? (
                    <Hint value={hint.point}>
                        <div className="tooltip">
                            <div>{formatNumber(hint.value)}</div>
                            <div>{hint.segment}</div>
                        </div>
                    </Hint>
                ) : undefined}
            </XYPlot>
        </div>
    );
}
