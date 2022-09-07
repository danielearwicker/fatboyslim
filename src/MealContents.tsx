import { ReactNode } from "react";
import { Meal } from "./data";
import { FatboyDispatch } from "./fatboyMethods";

export interface MealProps {
    meal: Meal;
    ate: { name: string; calories: number; quantity: number }[];
    stats: {
        caloriesAverage: number;
    };
    dispatch: FatboyDispatch;
    children: ReactNode;
}

export const MealContents = ({
    meal,
    ate,
    stats,
    dispatch,
    children,
}: MealProps) => {
    const totalCalories = ate
        .map(x => x.calories * x.quantity)
        .reduce((l, r) => l + r, 0);

    return (
        <div className="meal">
            <div className="meal-heading">
                <div className="title">{meal}</div>
                <div className="calories">
                    {totalCalories} (
                    {((100 * totalCalories) / stats.caloriesAverage).toFixed(0)}
                    %)
                </div>
            </div>
            <div className="ate">
                {ate.map(c => (
                    <div key={c.name} className="comestible">
                        <span className="calories">{c.calories}</span>
                        <span className="name">{c.name}</span>
                        <span
                            className="quantity"
                            onClick={() => {
                                dispatch(e => e.addAte(meal, c.name));
                            }}>
                            {c.quantity > 1 ? `x${c.quantity}` : "+"}
                        </span>
                        <span
                            className="delete"
                            onClick={() =>
                                dispatch(d => d.deleteAte(meal, c.name))
                            }>
                            🗑
                        </span>
                    </div>
                ))}
            </div>
            {children}
        </div>
    );
};
