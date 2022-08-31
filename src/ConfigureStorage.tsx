import { memo, useCallback, useState } from "react";
import { SlimStorage } from "./storage";

export interface ConfigureStorageProps {
    storage: SlimStorage;
}

export const ConfigureStorage = memo(({ storage }: ConfigureStorageProps) => {
    const [sasToken, setSasToken] = useState("");

    const save = useCallback(() => {
        storage.setSasToken(sasToken);
    }, [sasToken, storage]);

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSasToken(e.target.value);
    }, []);

    return (
        <div>
            <div>Enter SAS token</div>
            <div>
                <input type="password" value={sasToken} onChange={onChange} />
            </div>
            <div>
                <button onClick={save}>Save</button>
            </div>
        </div>
    );
});
