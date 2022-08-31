import produce from "immer";
import { addDays, Category, FatboyData, Meal, today } from "./data";

export type FatboyAction =
    | {
          type: "LOAD";
          config: FatboyData;
      }
    | {
          type: "SET_EDITING_DATE";
          date: string;
      }
    | {
          type: "TODAY";
      }
    | {
          type: "DAY_BEFORE";
      }
    | {
          type: "DAY_AFTER";
      }
    | {
          type: "DELETE_ATE";
          meal: Meal;
          comestible: string;
      }
    | {
          type: "ADD_ATE";
          meal: Meal;
          comestible: string;
      }
    | {
          type: "ADD_COMESTIBLE";
          name: string;
          calories: number;
          category: Category;
          redMeat: number;
      }
    | {
          type: "SET_CATEGORY";
          category: Category;
          comestible: string;
      }
    | {
          type: "CONFIGURE_COMESTIBLE";
          comestible: string;
          calories: number;
          redMeat: number;
      };

export function fatboyReducer(data: FatboyData, action: FatboyAction) {
    switch (action.type) {
        case "LOAD":
            return action.config;
        case "SET_EDITING_DATE":
            return produce(data, draft => {
                draft.editingDay = action.date;
            });
        case "TODAY":
            return produce(data, draft => {
                draft.editingDay = today();
            });
        case "DAY_BEFORE":
            return produce(data, draft => {
                draft.editingDay = addDays(draft.editingDay, -1);
            });
        case "DAY_AFTER":
            return produce(data, draft => {
                draft.editingDay = addDays(draft.editingDay, 1);
            });
        case "DELETE_ATE":
            return produce(data, draft => {
                const dayAt = draft.days.findIndex(
                    x => x.date === draft.editingDay
                );
                if (dayAt === -1) return;

                const day = draft.days[dayAt];
                const ateAt = day.ate.findIndex(
                    x =>
                        x.meal === action.meal &&
                        x.comestible === action.comestible
                );
                if (ateAt === -1) return;

                const ate = day.ate[ateAt];
                ate.quantity--;

                if (ate.quantity > 0) return;

                day.ate.splice(ateAt, 1);

                if (!day.ate.length) {
                    draft.days.splice(dayAt, 1);
                }
            });
        case "ADD_ATE":
            return produce(data, draft => {
                let day = draft.days.find(x => x.date === draft.editingDay);
                if (!day) {
                    day = { date: draft.editingDay, ate: [] };
                    draft.days.push(day);
                }

                let ate = day.ate.find(
                    x =>
                        x.meal === action.meal &&
                        x.comestible === action.comestible
                );
                if (!ate) {
                    ate = {
                        meal: action.meal,
                        comestible: action.comestible,
                        quantity: 0,
                    };
                    day.ate.push(ate);
                }

                ate.quantity++;
            });
        case "ADD_COMESTIBLE":
            return produce(data, draft => {
                if (
                    !draft.comestibles.find(
                        c => c.name.toLowerCase() === action.name.toLowerCase()
                    )
                ) {
                    draft.comestibles.push({
                        name: action.name,
                        calories: action.calories,
                        category: action.category,
                        redMeat: 0,
                    });
                }
            });
        case "SET_CATEGORY":
            return produce(data, draft => {
                const c = draft.comestibles.find(
                    x => x.name === action.comestible
                );
                if (c) {
                    c.category = action.category;
                }
            });
        case "CONFIGURE_COMESTIBLE":
            return produce(data, draft => {
                const c = draft.comestibles.find(
                    x => x.name === action.comestible
                );
                if (c) {
                    c.calories = action.calories;
                    c.redMeat = action.redMeat;
                }
            });
    }

    const catchAll: never = action;
    throw new Error(`Unrecognised action ${JSON.stringify(catchAll)}`);
}
