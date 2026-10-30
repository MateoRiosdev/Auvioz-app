const open = () =>
  new Promise((resolve, reject) => {
    const r = indexedDB.open("auvioz", 1);
    r.onupgradeneeded = () =>
      r.result.createObjectStore("audio", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
export async function historyStore(action, value) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        "audio",
        action === "getAll" ? "readonly" : "readwrite",
      );
      const request = tx.objectStore("audio")[action](value);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
