import { BlobServiceClient } from "@azure/storage-blob";
import { FatboyData } from "./data";
import "./styles.scss";

export function slimStorage() {
  const localKey = "fatboyslim-cs";
  const blobUri = "https://drefatboyslim.blob.core.windows.net/data/everything";

  let sasToken = localStorage.getItem(localKey) ?? "";
  
  function getFullUri() {
    return `${blobUri}?${sasToken}`;
  }

  let saveTimer: number | undefined = undefined;
  
  let loadPromise: undefined | Promise<FatboyData>;

  return {
    get configured() {
      return !!sasToken;
    },

    setSasToken(token: string) {
      localStorage.setItem(localKey, token);
      sasToken = token;
    },

    async load(): Promise<FatboyData> {
      if (!loadPromise) {
        console.log("Starting load");
        loadPromise = (async () => {
          const fetched = await fetch(getFullUri());
          const json = await fetched.text();      
          return JSON.parse(json) as FatboyData;
        })();
      }

      return await loadPromise;      
    },

    async saveSoon(config: FatboyData) {
      if (saveTimer !== undefined) {
        window.clearTimeout(saveTimer);
      }

      saveTimer = window.setTimeout(async () => {

        const client = new BlobServiceClient(`https://drefatboyslim.blob.core.windows.net?${sasToken}`);
        const container = client.getContainerClient("data");
        const remoteBlob = container.getBlockBlobClient("everything");

        const blob = new Blob([JSON.stringify(config)], {
          type: "text/json"
        });

        await remoteBlob.uploadData(blob);

      }, 2000);

    }
  }
}

export type SlimStorage = ReturnType<typeof slimStorage>;
