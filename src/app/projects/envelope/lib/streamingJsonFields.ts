// Incrementally locates top-level `"field": <value>` entries in a growing JSON
// text buffer, so we can emit a field the moment its value closes instead of
// waiting for the whole object to finish streaming.

export interface FieldScanResult {
  raw: string;
  endIndex: number;
}

export function scanField(buffer: string, fieldName: string): FieldScanResult | null {
  const keyPattern = new RegExp(`"${fieldName}"\\s*:\\s*`);
  const keyMatch = keyPattern.exec(buffer);
  if (!keyMatch) return null;

  const start = keyMatch.index + keyMatch[0].length;
  if (start >= buffer.length) return null;
  const startChar = buffer[start];

  if (startChar === "{" || startChar === "[") {
    const stack: string[] = [startChar];
    let inString = false;
    let escape = false;
    for (let i = start + 1; i < buffer.length; i++) {
      const ch = buffer[i];
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") {
        stack.pop();
        if (stack.length === 0) {
          return { raw: buffer.slice(start, i + 1), endIndex: i + 1 };
        }
      }
    }
    return null;
  }

  if (startChar === '"') {
    let escape = false;
    for (let i = start + 1; i < buffer.length; i++) {
      const ch = buffer[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        return { raw: buffer.slice(start, i + 1), endIndex: i + 1 };
      }
    }
    return null;
  }

  // primitive: number, null, true, false — ends at the next unescaped delimiter
  const rest = buffer.slice(start);
  const delim = rest.match(/[,}\]]/);
  if (!delim || delim.index === undefined) return null;
  return { raw: rest.slice(0, delim.index).trim(), endIndex: start + delim.index };
}
