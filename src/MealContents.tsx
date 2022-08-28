import { ReactNode } from "react";
import { Meal } from "./data";
import { FatboyAction } from "./reducer";

export interface MealProps {  
  meal: Meal;
  ate: { name: string; calories: number, quantity: number }[];
  dispatch: React.Dispatch<FatboyAction>;
  children: ReactNode;
}

export const MealContents = (({ meal, ate, dispatch, children }: MealProps) => {
  return (    
    <div className="meal">
      <div className="meal-heading">{meal}</div>
      <div className="ate">
        {ate.map((c) => (
          <div key={c.name} className="comestible">
            <span className="calories">{c.calories}</span>
            <span className="name">{c.name}</span>
            <span
              className="quantity"
              onClick={() => {
                dispatch({
                  type: "ADD_ATE",
                  meal,
                  comestible: c.name
                });
              }}
            >
              {c.quantity > 1 ? `x${c.quantity}` : "+"}
            </span>
            <span
              className="delete"
              onClick={() =>
                dispatch({
                  type: "DELETE_ATE",
                  meal,
                  comestible: c.name
                })
              }
            >
              🗑
            </span>
          </div>
        ))}
      </div>
      {children}      
    </div>
  );
});
