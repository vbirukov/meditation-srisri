/** Кодирует имя файла в URL (кириллица, пробелы, кавычки). */
export function encodeMediaUrl(url: string): string {
  const slash = url.lastIndexOf('/');
  if (slash === -1) return encodeURI(url);
  return `${url.slice(0, slash + 1)}${encodeURIComponent(url.slice(slash + 1))}`;
}
