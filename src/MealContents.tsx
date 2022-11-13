import React from "react";
import { ReactNode } from "react";
import { Meal } from "./data";
import { FatboyAction } from "./reducer";

export interface MealProps {
    meal: Meal;
    ate: { id: string; label: string; calories: number; quantity: number }[];
    stats: {
        caloriesAverage: number;
    };
    limit: number;
    dispatch: React.Dispatch<FatboyAction>;
    children: ReactNode;
}

export const MealContents = ({
    meal,
    ate,
    stats,
    limit,
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
                    <div key={c.id} className="comestible">
                        <span className="calories">{c.calories}</span>
                        <span className="name">{c.label}</span>
                        <span
                            className={`quantity${
                                c.calories > limit ? " too-much" : ""
                            }`}
                            onClick={() => {
                                dispatch({
                                    type: "ADD_ATE",
                                    meal,
                                    comestible: c.id,
                                });
                            }}>
                            {c.quantity > 1 ? `x${c.quantity}` : "+"}
                        </span>
                        <span
                            className="delete"
                            onClick={() =>
                                dispatch({
                                    type: "DELETE_ATE",
                                    meal,
                                    comestible: c.id,
                                })
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
