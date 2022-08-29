import "./styles.scss";

export const categories = ["savoury", "carbs", "condiment", "dairy", "bread", "treat", "drink", "booze", "fruit", "veg", "cereal", "other"] as const;
export type Category = typeof categories[number];

export type Comestible = Readonly<{
  name: string;
  calories: number;
  category: Category;
}>;

export function searchComestibles(comestibles: readonly Comestible[], search: string, exclude: (c: string) => boolean) {
  return comestibles
          .filter(
            (x) =>
              !exclude(x.name) &&
              search.toLowerCase().split(" ").every(part => 
                x.name.toLowerCase().includes(part))
          )
          .map(x => ({
            match: x,
            score: search.toLowerCase() === x.name ? 1 : 0
          }))
          .sort((l, r) => r.score - l.score)
          .map(x => x.match);
}

export const meals = ["breakfast", "lunch", "tea", "pud"] as const;

export type Meal = typeof meals[number];

export type Ate = Readonly<{
  comestible: string;
  meal: Meal;
  quantity: number;
}>;

export function isoDate(d: Date) {
  return d.toISOString().substring(0, 10);
}

export function addDays(date: string, add: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + add);
  return isoDate(d);
}

export function today(): string {
  return isoDate(new Date());
}

export type Day = Readonly<{
  date: string;
  ate: Ate[];
}>;

export type FatboyData = Readonly<{
  comestibles: readonly Comestible[];
  days: readonly Day[];
  editingDay: string;
}>;

export function sum(ar: number[]) {
  return ar.reduce((l, r) => l + r, 0);
}

export function getComestibleMap(state: FatboyData) {
  return Object.fromEntries(state.comestibles.map(x => [x.name, x]));
}

export function getDayFacts(day: Day, comestibles: Record<string, Comestible>) {
  return day.ate.map(a => {
    const c = comestibles[a.comestible] ?? {
      name: "unknown",
      category: "other",
      calories: 0
    };
    return {
      category: c.category,
      quantity: a.quantity,
      calories: c.calories * a.quantity,
      comestible: c.name,
      meal: a.meal,
    };    
  });
}

export function getFacts(state: FatboyData, comestibles: Record<string, Comestible>) {
  return state.days.flatMap(d => getDayFacts(d, comestibles));
}

export function formatNumber(value: number, precision = 1) {
  return value.toFixed(precision).replace(/\.0+$/, "");
}
