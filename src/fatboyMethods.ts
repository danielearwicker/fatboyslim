import { Draft } from "immer/dist/internal";
import { MethodDispatch } from "./useMethodReducer";
import { addDays, Category, Comestible, FatboyData, Meal, today } from "./data";

export const comestibleMethods = (state: Draft<Comestible>) => ({
    setCategory(category: Category) {
        state.category = category;
    },

    configureComestible(calories: number, redMeat: number) {
        state.calories = calories;
        state.redMeat = redMeat;
    },
});

export function withComestible(state: FatboyData, comestible: string) {
    const c = state.comestibles.find(x => x.name === comestible);
    if (!c) {
        throw new Error(`No such comestible: ${comestible}`);
    }
}

export const fatboyUpdater = {
    actions: (state: Draft<FatboyData>) => ({
        load(data: FatboyData) {
            Object.assign(state, data);
        },

        setEditingDate(date: string) {
            state.editingDay = date;
        },

        today() {
            state.editingDay = today();
        },

        dayBefore() {
            state.editingDay = addDays(state.editingDay, -1);
        },

        dayAfter() {
            state.editingDay = addDays(state.editingDay, 1);
        },

        deleteAte(meal: Meal, comestible: string) {
            const dayAt = state.days.findIndex(x => x.date === state.editingDay);
            if (dayAt === -1) return;

            const day = state.days[dayAt];
            const ateAt = day.ate.findIndex(
                x => x.meal === meal && x.comestible === comestible
            );
            if (ateAt === -1) return;

            const ate = day.ate[ateAt];
            ate.quantity--;

            if (ate.quantity > 0) return;

            day.ate.splice(ateAt, 1);

            if (!day.ate.length) {
                state.days.splice(dayAt, 1);
            }
        },

        addAte(meal: Meal, comestible: string) {
            let day = state.days.find(x => x.date === state.editingDay);
            if (!day) {
                day = { date: state.editingDay, ate: [] };
                state.days.push(day);
            }

            let ate = day.ate.find(
                x => x.meal === meal && x.comestible === comestible
            );
            if (!ate) {
                ate = {
                    meal: meal,
                    comestible: comestible,
                    quantity: 0,
                };
                day.ate.push(ate);
            }

            ate.quantity++;
        },

        addComestible(
            name: string,
            calories: number,
            category: Category,
            redMeat: number
        ) {
            if (
                !state.comestibles.find(
                    c => c.name.toLowerCase() === name.toLowerCase()
                )
            ) {
                state.comestibles.push({
                    name,
                    calories,
                    category,
                    redMeat,
                });
            }
        }
    }),

const comestibleUpdater = {
    action 
    setCategory(category: Category, comestible: string) {
        const c = state.comestibles.find(x => x.name === comestible);
        if (c) {
            c.category = category;
        }
    },

    configureComestible(comestible: string, calories: number, redMeat: number) {
        const c = state.comestibles.find(x => x.name === comestible);
        if (c) {
            c.calories = calories;
            c.redMeat = redMeat;
        }
    },
});

export type FatboyDispatch = MethodDispatch<ReturnType<typeof fatboyMethods>>;
