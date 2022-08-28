import "./styles.scss";

export type Comestible = Readonly<{
  name: string;
  calories: number;
}>;

export const meals = ["breakfast", "lunch", "tea", "pud"] as const;

export type Meal = typeof meals[number];

export type Ate = Readonly<{
  comestible: string;
  meal: Meal;
  quantity: number;
}>;

export function today(): string {
  return new Date().toISOString().substring(0, 11);
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
