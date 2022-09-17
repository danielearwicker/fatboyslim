import { BlobServiceClient } from "@azure/storage-blob";
import { useEffect, useReducer, useRef, useState } from "react";
import { FatboyData } from "./data";
import { FatboyAction, fatboyReducer } from "./reducer";
import "./styles.scss";

export interface VersionedFatboyData {
    data: FatboyData;
    version: string;
}

const initialState: FatboyData = {
    measurements: [],
    comestibles: [],
    days: [],
    editingDay: "2022-08-27",
};

const localKey = "fatboyslim-cs";

export function useSlimStorage() {
    const [state, dispatchWithoutSave] = useReducer(
        fatboyReducer,
        initialState
    );
    const [version, setVersion] = useState("none");
    const [sasToken, setSasToken] = useState(
        localStorage.getItem(localKey) ?? ""
    );
    const shouldLoad = useRef(true);
    const [shouldSave, setShouldSave] = useState(false);

    function getBlob() {
        const client = new BlobServiceClient(
            `https://drefatboyslim.blob.core.windows.net?${sasToken}`
        );
        const container = client.getContainerClient("data");
        return container.getBlockBlobClient("everything");
    }

    async function loadBlob(): Promise<VersionedFatboyData> {
        const fetchedBlob = await getBlob().download();
        const version = fetchedBlob.etag!;
        const body = await fetchedBlob.blobBody;
        const json = await body!.text();
        const data = JSON.parse(json);

        return { data: data as FatboyData, version };
    }

    async function saveBlob(versioned: VersionedFatboyData) {
        const blob = new Blob([JSON.stringify(versioned.data)], {
            type: "text/json",
        });

        const result = await getBlob().uploadData(blob, {
            conditions: {
                ifMatch: versioned.version,
            },
        });

        console.log("Saved version", result.etag);
        setVersion(result.etag!);
    }

    useEffect(() => {
        async function load() {
            try {
                const loaded = await loadBlob();
                dispatchWithoutSave({ type: "LOAD", config: loaded.data });
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
    const queuedActions = useRef<FatboyAction[]>([]);

    function saveSoon() {
        if (saveTimer.current !== undefined) {
            window.clearTimeout(saveTimer.current);
        }

        saveTimer.current = window.setTimeout(() => setShouldSave(true), 2000);
    }

    useEffect(() => {
        async function reconcile() {
            try {
                await saveBlob({ data: state, version });
                queuedActions.current = [];
                return;
            } catch (e) {
                const er = e as Error;
                console.log(
                    `reconcile after failing based on version`,
                    version,
                    er.message
                );

                const loaded = await loadBlob();
                dispatchWithoutSave({ type: "LOAD", config: loaded.data });

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

    return {
        state,

        get configured() {
            return !!sasToken;
        },

        setSasToken(token: string) {
            localStorage.setItem(localKey, token);
            setSasToken(token);
        },

        dispatch(action: FatboyAction) {
            queuedActions.current.push(action);
            dispatchWithoutSave(action);

            saveSoon();
        },
    };
}

export type SlimStorage = ReturnType<typeof useSlimStorage>;
