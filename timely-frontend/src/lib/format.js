export const dateFmt = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" });
export function formatDate(s) { try { return dateFmt.format(new Date(s)); } catch { return s || ""; } }
