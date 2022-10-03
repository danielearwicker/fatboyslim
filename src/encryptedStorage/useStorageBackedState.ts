import { useEffect, useReducer, useRef, useState } from "react";
import { StorageConfig } from "./Storage";

export function useStorageBackedState<T extends object, A>(
    storage: StorageConfig,
    name: string,
    reducer: (old: T, action: A) => T,
    initialState: T,
    generateLoadAction: (state: T) => A
) {
    const [state, dispatchWithoutSave] = useReducer(reducer, initialState);

    const [version, setVersion] = useState("none");

    const shouldLoad = useRef(true);
    const [shouldSave, setShouldSave] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const loaded = await storage.load(name);
                if (loaded.data) {
                    const state = JSON.parse(
                        new TextDecoder().decode(loaded.data)
                    ) as T;
                    dispatchWithoutSave(generateLoadAction(state));
                }
                console.log("Loaded version", loaded.version);
                setVersion(loaded.version);
            } catch (e) {
                console.error(e);
            }
        }

        if (shouldLoad.current) {
            shouldLoad.current = false;
            load();
        }
    }, []);

    const saveTimer = useRef<number | undefined>();
    const queuedActions = useRef<A[]>([]);

    function saveSoon() {
        if (saveTimer.current !== undefined) {
            window.clearTimeout(saveTimer.current);
        }

        saveTimer.current = window.setTimeout(() => setShouldSave(true), 2000);
    }

    useEffect(() => {
        async function reconcile() {
            try {
                const data = new TextEncoder().encode(JSON.stringify(state));
                setVersion(await storage.save(name, { data, version }));
                queuedActions.current = [];
                return;
            } catch (e) {
                const er = e as Error;
                console.log(
                    `reconcile after failing based on version`,
                    version,
                    er.message
                );

                const loaded = await storage.load(name);
                const state = JSON.parse(
                    new TextDecoder().decode(loaded.data)
                ) as T;
                dispatchWithoutSave(generateLoadAction(state));

                console.log("Loaded version", loaded.version);
                setVersion(loaded.version);

                for (const action of queuedActions.current) {
                    console.log("Reapplying", action);
                    dispatchWithoutSave(action);
                }

                saveSoon();
            }
        }

        if (shouldSave) {
            setShouldSave(false);
            reconcile();
        }
    }, [shouldSave, state]);

    return [
        state,

        (action: A) => {
            queuedActions.current.push(action);
            dispatchWithoutSave(action);

            saveSoon();
        },
    ] as const;
}
