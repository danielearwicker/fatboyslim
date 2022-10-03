import { Tabs } from "./Tabs";
import { Storage } from "./encryptedStorage/Storage";
import "./styles.scss";

export default function App() {
    return (
        <Storage>
            <Tabs />
        </Storage>
    );
}
