export const readCookie = (
  setCookieHeader: string | string[] | undefined,
  name: string,
) => {
  const values = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
      ? [setCookieHeader]
      : [];
  for (const value of values) {
    const pair = value.split(';', 1)[0];
    if (!pair) continue;
    const separator = pair.indexOf('=');
    if (separator > 0 && pair.slice(0, separator) === name) {
      return pair.slice(separator + 1);
    }
  }
  return undefined;
};
