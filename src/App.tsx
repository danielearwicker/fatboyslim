import { Tabs } from "./Tabs";
import { Storage } from "./encryptedStorage/Storage";
import { azureBackend } from "./encryptedStorage/azureBackend";
import "./styles.scss";

export default function App() {
    return (
        <Storage backend={azureBackend}>
            <Tabs />
        </Storage>
    );
}
