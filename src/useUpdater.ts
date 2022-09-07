import produce from "immer";
import { Draft } from "immer/dist/internal";
import { useReducer } from "react";

export type UpdaterActions = Record<string, (...args: any) => void>;

export type UpdaterSelectors = Record<
    string,
    (...args: any) => StateSelector<any>
>;

export type Updater<
    State,
    Actions extends UpdaterActions,
    Selectors extends UpdaterSelectors
> = {
    actions: (state: Draft<State>) => Actions;
    selectors: (state: State) => Selectors;
};

export type StateSelector<State> = {
    state: State | undefined;
    updater: Updater<State, any, any>;
};

export type ActionsReturningVoid<Actions extends UpdaterActions> = {
    [P in keyof Actions]: (...args: Parameters<Actions[P]>) => void;
};

export type SelectorsReturningBinding<Selectors extends UpdaterSelectors> = {
    [P in keyof Selectors]: (
        ...args: Parameters<Selectors[P]>
    ) => UpdaterBinding<
        ReturnType<Selectors[P]>["state"],
        ReturnType<ReturnType<Selectors[P]>["updater"]["actions"]>,
        ReturnType<ReturnType<Selectors[P]>["updater"]["selectors"]>
    >;
};

export type UpdaterBinding<
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

export function useUpdater<
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
