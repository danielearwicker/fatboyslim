import { memo, useMemo } from "react";
import { Comestible, formatNumber } from "./data";
import "./styles.scss";

const dailyLimit = 1800;

export interface ProgressBarProps {
    ate: { comestible: Comestible; quantity: number }[];
}

export const ProgressBar = memo(({ ate }: ProgressBarProps) => {
    const total = useMemo(
        () =>
            ate
                .map(a => a.comestible.calories * a.quantity)
                .reduce((l, r) => l + r, 0),
        [ate]
    );

    const progress = (100 * total) / dailyLimit;

    return total > dailyLimit ? (
        <h2 className="over-the-limit">
            You are {total - dailyLimit} ({Math.round(progress - 100)}%) over
            your limit!
        </h2>
    ) : (
        <div className="calorie-bar">
            <div className="progress" style={{ width: `${progress}%` }} />
            <div className="ate">{formatNumber(total)}</div>
            <div className="remaining">{formatNumber(dailyLimit - total)}</div>
        </div>
    );
});
