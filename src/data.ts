import "./styles.scss";

export const categories = [
    "savoury",
    "carbs",
    "condiment",
    "dairy",
    "bread",
    "treat",
    "drink",
    "booze",
    "fruit",
    "veg",
    "cereal",
    "other",
] as const;
export type Category = typeof categories[number];

export type Comestible = Readonly<{
    id: string;
    label: string;
    calories: number;
    category: Category;
    redMeat: number;
}>;

export function probabilityOfAGivenB<T>(
    items: readonly Readonly<T>[],
    classify: (item: Readonly<T>) => { a: boolean; b: boolean }
) {
    let countOnlyB = 0,
        countAB = 0;

    for (const item of items) {
        const { a, b } = classify(item);
        if (b) {
            if (a) {
                countAB++;
            } else {
                countOnlyB++;
            }
        }
    }

    const countB = countAB + countOnlyB;
    return countB === 0 ? 0 : countAB / countB;
}

function getParts(str: string) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(" ");
}

function compareStrings(within: string, find: string) {
    const withinParts = getParts(within);
    const findParts = getParts(find);

    let matches = 0;

    for (const findPart of findParts) {
        for (const withinPart of withinParts) {
            matches += withinPart.startsWith(findPart) ? 1 : 0;
        }
    }

    return matches;
}

export function sortComestibleChoices(
    choices: {
        probability: number;
        comestible: {
            calories: number;
        };
    }[],
    limit: number
) {
    choices.sort((l, r) => {
        const lAllowed = l.comestible.calories < limit ? 1 : 0;
        const rAllowed = r.comestible.calories < limit ? 1 : 0;
        if (lAllowed === rAllowed) {
            return r.probability - l.probability;
        }
        return rAllowed - lAllowed;
    });
}

export function searchComestibles(
    comestibles: readonly Comestible[],
    search: string,
    limit: number
) {
    const found = comestibles
        .map(comestible => ({
            comestible,
            score: compareStrings(comestible.label, search),
        }))
        .filter(x => x.score > 0);

    const total = found.map(x => x.score).reduce((l, r) => l + r, 0);

    const scaled = found.map(x => ({
        ...x,
        probability: x.score / total,
    }));

    sortComestibleChoices(scaled, limit);
    return scaled;
}

export const meals = ["breakfast", "lunch", "tea", "pud"] as const;

export type Meal = typeof meals[number];

export type Ate = Readonly<{
    comestible: string;
    meal: Meal;
    quantity: number;
}>;

export function isoDate(d: Date) {
    if (typeof d === "number") {
        const s = `${d}`;
        return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6)}`;
    }
    return d.toISOString().substring(0, 10);
}

export function addDays(date: string, add: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + add);
    return isoDate(d);
}

export function dateDiff(date1: string, date2: string) {
    const d1 = new Date(date1),
        d2 = new Date(date2);

    return Math.floor((d2.getTime() - d1.getTime()) / 86400000);
}

export function today(): string {
    return isoDate(new Date());
}

export type Day = Readonly<{
    date: string;
    ate: Ate[];
}>;

export const measurementTypes = ["Waist/cm", "Weight/kg"] as const;

export type MeasurementType = typeof measurementTypes[number];

export interface Measurement {
    value: number;
    date: string;
    type: MeasurementType;
}

export interface Picture {
    id: string;
    type: string;
}

export interface Note {
    text: string;
    date: string;
    pictures: Picture[];
}

export type FatboyData = Readonly<{
    measurements: Measurement[];
    comestibles: readonly Comestible[];
    days: readonly Day[];
    notes: Note[];
    editingDay: string;
}>;

export function sum(ar: number[]) {
    return ar.reduce((l, r) => l + r, 0);
}

export function getComestibleMap(state: FatboyData) {
    return Object.fromEntries(state.comestibles.map(x => [x.id, x]));
}

export function getDayFacts(day: Day, comestibles: Record<string, Comestible>) {
    return day.ate.map(a => {
        const c = comestibles[a.comestible] ?? {
            name: "unknown",
            category: "other",
            calories: 0,
            redMeat: 0,
            comestible: a.comestible,
            meal: a.meal,
        };

        return {
            category: c.category,
            quantity: a.quantity,
            calories: c.calories * a.quantity,
            redMeat: c.redMeat * a.quantity,
            comestible: c.id,
            meal: a.meal,
        };
    });
}

export function getFacts(
    state: FatboyData,
    comestibles: Record<string, Comestible>
) {
    return state.days.flatMap(d => getDayFacts(d, comestibles));
}

export function formatNumber(value: number, precision = 1) {
    return value.toFixed(precision).replace(/\.0+$/, "");
}
