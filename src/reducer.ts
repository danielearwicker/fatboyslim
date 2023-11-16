import produce from "immer";
import {
    addDays,
    Category,
    FatboyData,
    Meal,
    MeasurementType,
    today,
} from "./data";
import { useStorage } from "./encryptedStorage/Storage";
import { useStorageBackedState } from "./encryptedStorage/useStorageBackedState";

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
          sugar: number;
          alcohol: number;
          satch: number;
          meal: Meal;
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
          sugar: number;
          alcohol: number;
          satch: number;
          newName: string;
      }
    | {
          type: "ADD_MEASUREMENT";
          measurementType: MeasurementType;
          value: number;
      }
    | {
          type: "REMOVE_MEASUREMENT";
          measurementType: MeasurementType;
      }
    | {
          type: "EDIT_NOTE";
          text: string;
      }
    | {
          type: "ADD_NOTE_PICTURE";
          id: string;
          contentType: string;
      }
    | {
          type: "REMOVE_NOTE_PICTURE";
          id: string;
      };

export function fatboyReducer(data: FatboyData, action: FatboyAction) {
    switch (action.type) {
        case "LOAD": {
            return action.config;
        }
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
                        c => c.label.toLowerCase() === action.name.toLowerCase()
                    )
                ) {
                    const id = window.crypto.randomUUID();
                    draft.comestibles.push({
                        id,
                        label: action.name,
                        calories: action.calories,
                        category: action.category,
                        redMeat: 0,
                        sugar: 0,
                        alcohol: 0,
                        satch: 0,
                    });

                    let day = draft.days.find(x => x.date === draft.editingDay);
                    if (!day) {
                        day = { date: draft.editingDay, ate: [] };
                        draft.days.push(day);
                    }

                    day.ate.push({
                        meal: action.meal,
                        comestible: id,
                        quantity: 1,
                    });
                }
            });
        case "SET_CATEGORY":
            return produce(data, draft => {
                const c = draft.comestibles.find(
                    x => x.id === action.comestible
                );
                if (c) {
                    c.category = action.category;
                }
            });
        case "CONFIGURE_COMESTIBLE":
            return produce(data, draft => {
                const c = draft.comestibles.find(
                    x => x.id === action.comestible
                );
                if (c) {
                    c.calories = action.calories;
                    c.redMeat = action.redMeat;
                    c.sugar = action.sugar;
                    c.alcohol = action.alcohol;
                    c.satch = action.satch;
                    c.label = action.newName;
                }
            });
        case "ADD_MEASUREMENT":
            return produce(data, draft => {
                const existing = draft.measurements.find(
                    x =>
                        x.date === draft.editingDay &&
                        x.type === action.measurementType
                );
                if (existing) {
                    existing.value = action.value;
                } else {
                    draft.measurements.push({
                        type: action.measurementType,
                        value: action.value,
                        date: draft.editingDay,
                    });
                }
            });
        case "REMOVE_MEASUREMENT":
            return produce(data, draft => {
                const existing = draft.measurements.findIndex(
                    x =>
                        x.date === draft.editingDay &&
                        x.type === action.measurementType
                );
                if (existing !== -1) {
                    draft.measurements.splice(existing, 1);
                }
            });
        case "EDIT_NOTE":
            return produce(data, draft => {
                const existing = draft.notes?.find(
                    x => x.date === draft.editingDay
                );
                if (existing) {
                    existing.text = action.text;
                } else {
                    draft.notes?.push({
                        text: action.text,
                        date: draft.editingDay,
                        pictures: [],
                    });
                }
            });
        case "ADD_NOTE_PICTURE":
            return produce(data, draft => {
                const existing = draft.notes?.find(
                    x => x.date === draft.editingDay
                );
                const pic = {
                    id: action.id,
                    type: action.contentType,
                };
                if (existing) {
                    existing.pictures.push(pic);
                } else {
                    draft.notes?.push({
                        text: "",
                        date: draft.editingDay,
                        pictures: [pic],
                    });
                }
            });
        case "REMOVE_NOTE_PICTURE":
            return produce(data, draft => {
                const existing = draft.notes?.find(
                    x => x.date === draft.editingDay
                );
                if (existing) {
                    const i = existing.pictures.findIndex(
                        x => x.id === action.id
                    );
                    if (i !== -1) {
                        existing.pictures.splice(i, 1);
                    }
                }
            });
    }

    const catchAll: never = action;
    throw new Error(`Unrecognised action ${JSON.stringify(catchAll)}`);
}

const initialState: FatboyData = {
    measurements: [],
    comestibles: [],
    days: [],
    notes: [],
    editingDay: "2022-08-27",
};

function generateLoadAction(config: FatboyData): FatboyAction {
    return { type: "LOAD", config };
}

export function useFatboyStorage() {
    const storage = useStorage();

    return useStorageBackedState(
        storage,
        "fatboy",
        fatboyReducer,
        initialState,
        generateLoadAction
    );
}

export type FatboyStorage = ReturnType<typeof useFatboyStorage>;
