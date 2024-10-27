export const isJsonString = (str: string) => {
  try {
    JSON.parse(str);

    return true;
  } catch {
    return false;
  }
};
