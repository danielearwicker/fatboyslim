import React from "react";
import { ReactNode } from "react";
import { ComestibleWithQuantities, Meal } from "./data";
import { FatboyAction } from "./reducer";

export interface MealProps {
    meal: Meal;
    ate: (ComestibleWithQuantities & {
        quantity: number;
    })[];
    stats: {
        caloriesAverage: number;
    };
    limit: number;
    dispatch: React.Dispatch<FatboyAction>;
    showComestible(name: string): void;
    children: ReactNode;
}

export const MealContents = ({
    meal,
    ate,
    stats,
    limit,
    dispatch,
    showComestible,
    children,
}: MealProps) => {
    const totalCalories = ate
        .map(x => x.calories * x.quantity)
        .reduce((l, r) => l + r, 0);

    function setQuantity(comestible: string, old: number, choice: string) {
        const newQuantity =
            choice === "other" ? prompt("Quantity", `${old}`) : choice;

        if (newQuantity !== null) {
            const parsed = parseFloat(newQuantity);
            if (!isNaN(parsed)) {
                dispatch({
                    type: "ADD_ATE",
                    meal,
                    comestible,
                    quantity: parsed,
                });
            }
        }
    }

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
                        {!!c.sugar && <span>🦷</span>}
                        {!!c.satch && <span>💔</span>}
                        {!!c.redMeat && <span>🥩</span>}
                        {!!c.alcohol && <span>🍺</span>}
                        {(c.satch === undefined ||
                            c.sugar === undefined ||
                            c.redMeat === undefined ||
                            c.alcohol === undefined) && (
                            <span className="satch">🤨</span>
                        )}
                        <span className="calories">{c.calories}</span>
                        <span
                            className="name"
                            onClick={() => showComestible(c.label)}>
                            {c.label}
                        </span>
                        <select
                            className="quantity"
                            value={c.quantity}
                            onChange={e => {
                                setQuantity(c.id, c.quantity, e.target.value);
                            }}>
                            {Object.keys(c.quantities)
                                .map(k => parseFloat(k))
                                .sort((a, b) => a - b)
                                .map(q => (
                                    <option value={q}>{q}</option>
                                ))}
                            <option value="other">Other...</option>
                        </select>
                        <span
                            className="delete"
                            onClick={() =>
                                dispatch({
                                    type: "DELETE_ATE",
                                    meal,
                                    comestible: c.id,
                                })
                            }>
                            ❌
                        </span>
                    </div>
                ))}
            </div>
            {children}
        </div>
    );
};
