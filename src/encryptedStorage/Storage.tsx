import { BlobServiceClient } from "@azure/storage-blob";
import React, { createContext, useContext, useState } from "react";
import { decrypt, encrypt, generateEncryptionKey } from "./crypto";
import { useLocalStorageState } from "./useLocalStorageState";

export interface StoragePayload {
    version: string;
    data: ArrayBuffer | undefined;
}

export interface StorageConfig {
    encryptionKey: string;
    blobConnectionString: string;
    load(name: string): Promise<StoragePayload>;
    save(name: string, data: StoragePayload): Promise<string>;
}

function getBlob(url: string, name: string) {
    const client = new BlobServiceClient(url);
    const container = client.getContainerClient("data");
    return container.getBlockBlobClient(name);
}

const StorageContext = createContext<StorageConfig>({
    encryptionKey: "",
    blobConnectionString: "",
    load: () => Promise.resolve({ data: undefined, version: "" }),
    save: () => Promise.resolve(""),
});

export function useStorage() {
    return useContext(StorageContext);
}

export interface StorageProps {}

export function Storage({ children }: React.PropsWithChildren<StorageProps>) {
    const [key, setKey] = useLocalStorageState("storage-key");
    const [con, setCon] = useLocalStorageState("storage-con");
    const [editingKey, setEditingKey] = useState(key);
    const [editingCon, setEditingCon] = useState(con);
    const [showConfig, setShowConfig] = useState(false);

    async function onClickGenerateKey() {
        setKey(await generateEncryptionKey());
    }

    const ctx: StorageConfig = {
        encryptionKey: key,
        blobConnectionString: con,
        async load(name) {
            const fetchedBlob = await getBlob(con, name).download();
            const version = fetchedBlob.etag!;
            let data: ArrayBuffer | undefined = undefined;
            try {
                const body = await fetchedBlob.blobBody;
                const encrypted = await body!.arrayBuffer();
                data = await decrypt(encrypted, key);
            } catch (x) {}

            return { data, version };
        },
        async save(name, { data, version }) {
            if (!data) return version;

            const encrypted = await encrypt(data, key);
            const conditions = !version
                ? {}
                : {
                      ifMatch: version,
                  };

            const result = await getBlob(con, name).uploadData(encrypted, {
                conditions,
            });
            console.log("actual version", result.etag);
            return result.etag!;
        },
    };

    return (
        <div className="app">
            {!key || !con || showConfig ? (
                <div className="storage-options">
                    <h2>Encryption key</h2>
                    <p>
                        <input
                            value={editingKey}
                            onChange={e => setEditingKey(e.target.value)}
                        />
                    </p>
                    <p>
                        <button onClick={() => setKey(editingKey)}>Save</button>
                        <button onClick={() => setEditingKey(key)}>
                            Revert
                        </button>
                        <button onClick={onClickGenerateKey}>Generate</button>
                    </p>
                    <h2>Blob Connection String</h2>
                    <p>
                        <input
                            value={editingCon}
                            onChange={e => setEditingCon(e.target.value)}
                        />
                        {editingCon != con && (
                            <>
                                <button onClick={() => setCon(editingCon)}>
                                    Save
                                </button>
                                <button onClick={() => setEditingCon(con)}>
                                    Revert
                                </button>
                            </>
                        )}
                    </p>
                    <hr />
                    <p>
                        <button onClick={() => setShowConfig(false)}>
                            Back
                        </button>
                    </p>
                </div>
            ) : (
                <>
                    <div className="storage-options-bar">
                        <span
                            className="storage-options-link"
                            onClick={() => setShowConfig(true)}>
                            Show storage options
                        </span>
                    </div>
                    <div className="app-content">
                        <StorageContext.Provider value={ctx}>
                            {children}
                        </StorageContext.Provider>
                    </div>
                </>
            )}
        </div>
    );
}
