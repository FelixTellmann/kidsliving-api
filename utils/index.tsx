export const isSameArray = (a: (string | number)[], b: (string | number)[]): boolean => {
  const cleanSortArray = (z: (string | number)[]) => (
    JSON.stringify(z.map((x: string | number) => x.toString()
      .trim()
      .toLowerCase())
      .sort(
        (x, y) => {
          if (x < y) { return -1; }
          if (x > y) { return 1; }
          return 0;
        },
      ))
  );
  return cleanSortArray(a) === cleanSortArray(b);
};

export const addTag = (string: string, tag: string): string => [
  ...new Set(string.split(",").map((t) => t.trim()).concat(tag)),
].join(",");

export const removeTag = (string: string, tag: string): string => [
  ...new Set(string.split(",").map((t) => t.trim()).filter((x) => x !== tag)),
].join(",");

export const mergeTags = (tagList: string, tagListAddon: string): string => [
  ...new Set([
    ...tagList.split(",").map((t: string) => t.trim()),
    ...tagListAddon.split(",").map((t: string) => t.trim()),
  ]),
].filter((t) => t !== "").join(",");

export const mergeDescriptions = (description: string, descriptionAddon: string): string => [
  ...new Set([
    ...description.split(" "),
    ...descriptionAddon.split(" "),
  ]),
].filter((t) => t !== "").join(" ");

export const isSameTags = (tagList: string, secondTagList: string): boolean => {
  return isSameArray(tagList.split(","), secondTagList.split(","));
};
