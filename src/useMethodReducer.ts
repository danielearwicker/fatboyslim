import produce from "immer";
import { Draft } from "immer/dist/internal";
import { useReducer } from "react";

type UpdaterActions = Record<string, (...args: any) => void>;

type UpdaterSelectors = Record<string, (...args: any) => StateSelector<any>>;

type Updater<
    State,
    Actions extends UpdaterActions,
    Selectors extends UpdaterSelectors
> = {
    actions: (state: Draft<State>) => Actions;
    selectors: (state: State) => Selectors;
};

type StateSelector<State> = {
    state: State | undefined;
    updater: Updater<State, any, any>;
};

type ActionsReturningVoid<Actions extends UpdaterActions> = {
    [P in keyof Actions]: (...args: Parameters<Actions[P]>) => void;
};

type SelectorsReturningBinding<Selectors extends UpdaterSelectors> = {
    [P in keyof Selectors]: (
        ...args: Parameters<Selectors[P]>
    ) => UpdaterBinding<
        ReturnType<Selectors[P]>["state"],
        ReturnType<ReturnType<Selectors[P]>["updater"]["actions"]>,
        ReturnType<ReturnType<Selectors[P]>["updater"]["selectors"]>
    >;
};

type UpdaterBinding<
    State,
    Actions extends UpdaterActions,
    Selectors extends UpdaterSelectors
> = {
    state: State;
    update: ActionsReturningVoid<Actions>;
    select: SelectorsReturningBinding<Selectors>;
};

export type PayloadAction =
    | {
          type: "update";
          name: string;
          args: unknown[];
      }
    | {
          type: "select";
          name: string;
          args: unknown[];
          inner: PayloadAction;
      };

function createActionProxy(dispatch: (action: PayloadAction) => void) {
    return new Proxy(
        {},
        {
            get(_, name) {
                if (typeof name === "symbol") {
                    throw new Error(
                        "Cannot use symbol in method dispatch proxy"
                    );
                }
                return (...args: unknown[]) => {
                    dispatch({ type: "update", name, args });
                };
            },
            set() {
                throw new Error(
                    "Cannot set properties on method dispatch proxy"
                );
            },
            apply() {
                throw new Error("Cannot directly call method dispatch proxy");
            },
        }
    );
}

function createSelectProxy<State>(
    dispatch: (action: PayloadAction) => void,
    state: State,
    updater: Updater<State, any, any>
) {
    return new Proxy(
        {},
        {
            get(_, name) {
                if (typeof name === "symbol") {
                    throw new Error(
                        "Cannot use symbol in method dispatch proxy"
                    );
                }
                return (...args: unknown[]) => {
                    const selector = updater.selectors(state)[name](args);
                    const nextUpdater = selector.updater(selector.state);

                    function nextDispatch(action: PayloadAction) {
                        dispatch({
                            type: "select",
                            name: name as string,
                            args,
                            inner: action,
                        });
                    }

                    return {
                        state: selector.state,
                        select: createSelectProxy(
                            nextDispatch,
                            selector.state,
                            nextUpdater
                        ),
                        update: createActionProxy(nextDispatch),
                    };
                };
            },
            set() {
                throw new Error(
                    "Cannot set properties on method dispatch proxy"
                );
            },
            apply() {
                throw new Error("Cannot directly call method dispatch proxy");
            },
        }
    );
}

function useUpdater<
    State,
    Actions extends UpdaterActions,
    Selectors extends UpdaterSelectors
>(
    updater: Updater<State, Actions, Selectors>,
    initial: State
): UpdaterBinding<State, Actions, Selectors> {
    function reducer(data: State, action: PayloadAction) {
        return produce(data, draft => {
            while (action.type === "select") {
                let wrapper = updater.selectors(draft as any);
                const selector = wrapper[action.name](...action.args);
                draft = selector.state;
                updater = selector.updater;
                action = action.inner;
            }

            if (
                updater.actions(draft)[action.name](...action.args) !==
                undefined
            ) {
                throw new Error(
                    "Do not return values from reducer class methods"
                );
            }
        });
    }

    const [state, dispatch] = useReducer(reducer, initial);

    const update = createActionProxy(dispatch) as ActionsReturningVoid<Actions>;
    const select = createSelectProxy(
        dispatch,
        state,
        updater
    ) as SelectorsReturningBinding<Selectors>;

    const result: UpdaterBinding<State, Actions, Selectors> = {
        state,
        update,
        select,
    };

    return result;
}

interface Ingredient {
    name: string;
    allergyWarning: boolean;
}

const updateIngredient = {
    actions(ingredient: Draft<Ingredient>) {
        return {
            shouldWarn() {
                ingredient.allergyWarning = true;
            },
            doNotWarn() {
                ingredient.allergyWarning = false;
            },
        };
    },
};

interface Food {
    name: string;
    calories: number;
    ingredients: Ingredient[];
}

const updateFood = {
    actions(food: Draft<Food>) {
        return {
            setCalories(cal: number) {
                food.calories = cal;
            },
        };
    },
    selectors(food: Food) {
        return {
            ingredient(name: string) {
                return {
                    state: food.ingredients.find(x => x.name === name),
                    updater: updateIngredient,
                };
            },
        };
    },
};

type Menu = Readonly<{
    soupOfTheDay: string;
    foods: readonly Food[];
}>;

const emptyMenu: Menu = {
    soupOfTheDay: "",
    foods: [],
};

const updateMenu = {
    actions(menu: Draft<Menu>) {
        return {
            setSoupOfTheDay(soup: string) {
                menu.soupOfTheDay = soup;
            },
        };
    },
    selectors: (menu: Menu) => {
        return {
            food(name: string) {
                return {
                    state: menu.foods.find(x => x.name === name),
                    updater: updateFood,
                };
            },
        };
    },
};

const someMenu = useUpdater(updateMenu, emptyMenu);

someMenu.update.setSoupOfTheDay("egg");

const cake = someMenu.select.food("cake");

cake.update.setCalories(500);

const poison = cake.select.ingredient("poison");

poison.update.shouldWarn();

export interface MethodCallAction {
    type: string;
    args: unknown[];
}

export type MethodDispatch<T> = (
    dispatcher: (on: T) => void
) => MethodCallAction[];

export function useMethodReducer<State, Methods>(
    prefix: string,
    methods: (s: Draft<State>) => Methods,
    initialState: State
) {
    function reducer(data: State, action: MethodCallAction) {
        return produce(data, draft => {
            const wrapper = methods(draft) as any;
            if (wrapper[action.type](...action.args) !== undefined) {
                throw new Error(
                    "Cannot return values from reducer class methods"
                );
            }
        });
    }

    const [state, dispatch] = useReducer(reducer, initialState);

    const methodDispatch: MethodDispatch<Methods> = (
        update: (wrapper: Methods) => void
    ) => {
        const actions: MethodCallAction[] = [];
        const proxy = new Proxy(
            {},
            {
                get(target, method) {
                    if (typeof method === "symbol") {
                        throw new Error(
                            "Cannot use symbol in method dispatch proxy"
                        );
                    }
                    return (...args: unknown[]) => {
                        const action = { type: `${prefix}_${method}`, args };
                        actions.push(action);
                        dispatch(action);
                    };
                },
                set() {
                    throw new Error(
                        "Cannot set properties on method dispatch proxy"
                    );
                },
                apply(target, thisArg, argArray) {
                    throw new Error(
                        "Cannot directly call method dispatch proxy"
                    );
                },
            }
        );
        update(proxy as Methods);
        return actions;
    };

    return [state, methodDispatch, dispatch] as const;
}
