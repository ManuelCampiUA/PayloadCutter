// ─── IVASS Payload Cutter ───────────────────────────────────────────────────
// Compila con: tsc main.ts --target ES2017 --outDir .
// oppure usa il fallback inline in main.html.

function findKey(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  for (const prop of Object.keys(record)) {
    const found = findKey(record[prop], key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function extractKey(raw: string, key: string): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Fallback: cerca il blocco JSON contenente la chiave
    const idx = raw.indexOf(`"${key}"`);
    if (idx === -1) throw new Error(`Chiave "${key}" non trovata nel testo.`);

    const start = raw.lastIndexOf("{", idx);
    if (start === -1)
      throw new Error("Impossibile trovare l'inizio dell'oggetto JSON.");

    let depth = 0,
      end = -1;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === "{") depth++;
      else if (raw[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1)
      throw new Error("JSON non bilanciato: mancano parentesi di chiusura.");

    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  const value = findKey(parsed, key);
  if (value === undefined)
    throw new Error(`Chiave "${key}" non trovata nel JSON.`);

  return JSON.stringify(value, null, 2);
}

// ─── DOM wiring ──────────────────────────────────────────────────────────────

function initApp(): void;

function initApp(): void {
  const cropBtn = document.getElementById("cropBtn") as HTMLButtonElement;
  const copyBtn = document.getElementById("copyBtn") as HTMLButtonElement;
  const keyInput = document.getElementById("keyInput") as HTMLInputElement;
  const inputArea = document.getElementById("inputArea") as HTMLTextAreaElement;
  const outputArea = document.getElementById(
    "outputArea",
  ) as HTMLTextAreaElement;
  const outputRow = document.getElementById("outputRow") as HTMLDivElement;
  const errorMsg = document.getElementById("errorMsg") as HTMLDivElement;

  const showError = (msg: string) => {
    errorMsg.textContent = msg;
    errorMsg.style.display = "block";
    outputRow.style.display = "none";
  };

  const showResult = (text: string) => {
    errorMsg.style.display = "none";
    outputArea.value = text;
    outputRow.style.display = "block";
  };

  cropBtn.addEventListener("click", () => {
    const raw = inputArea.value.trim();
    const key = keyInput.value.trim();
    if (!raw) {
      showError("Inserisci un JSON in input.");
      return;
    }
    if (!key) {
      showError("Inserisci una chiave da estrarre.");
      return;
    }
    try {
      showResult(extractKey(raw, key));
    } catch (e) {
      showError((e as Error).message);
    }
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(outputArea.value).then(() => {
      copyBtn.textContent = "Copiato!";
      setTimeout(() => {
        copyBtn.textContent = "Copia";
      }, 1500);
    });
  });
}

document.addEventListener("DOMContentLoaded", initApp);
