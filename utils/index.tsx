export const isSameArray = (a: (string | number)[], b: (string | number)[]): boolean => {
  const cleanSortArray = (z: (string | number)[]) =>
    JSON.stringify(
      z
        .map((x: string | number) => x.toString().trim().toLowerCase())
        .sort((x, y) => {
          if (x < y) {
            return -1;
          }
          if (x > y) {
            return 1;
          }
          return 0;
        })
    );
  return cleanSortArray(a) === cleanSortArray(b);
};

export const addTag = (string: string, tag: string): string =>
  [
    ...new Set(
      string
        .split(",")
        .map(t => t.trim())
        .concat(tag)
    ),
  ].join(",");

export const removeTag = (string: string, tag: string): string =>
  [
    ...new Set(
      string
        .split(",")
        .map(t => t.trim())
        .filter(x => x !== tag)
    ),
  ].join(",");

export const mergeTags = (tagList: string, tagListAddon: string): string =>
  [...new Set([...tagList.split(",").map((t: string) => t.trim()), ...tagListAddon.split(",").map((t: string) => t.trim())])]
    ?.filter(t => t !== "")
    .join(",");

export const mergeDescriptions = (description: string, descriptionAddon: string): string => {
  return description.length > descriptionAddon.length ? description : descriptionAddon;
};

export const isSameTags = (tagList: string, secondTagList: string): boolean => {
  return isSameArray(tagList.split(","), secondTagList.split(","));
};

export const isSameDescription = (description: string, secondDescription: string): boolean => {
  const isSame = description.replace(/[^A-Za-z0-9]/gi, "") === secondDescription.replace(/[^A-Za-z0-9]/gi, "");

  if (!isSame) {
    console.log(description.replace(/[^A-Za-z0-9]/gi, ""));
    console.log(secondDescription.replace(/[^A-Za-z0-9]/gi, ""));
  }

  return isSame;
};

export const queryfy = (input: unknown): string | number => {
  // Make sure we don't alter integers.

  const obj = JSON.parse(JSON.stringify(input));

  if (typeof obj === "number") {
    return obj;
  }

  // Stringify everything other than objects.
  if (typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const props = obj.map(val => queryfy(val)).join(",");
    return `[${props}]`;
  }

  // Iterate through object keys to convert into a string
  // to be interpolated into the query.
  const props = Object.keys(obj)
    .map(key => `${key}:${queryfy(obj[key])}`)
    .join(",");

  return `{${props}}`.replace(/"([A-Z]+)"/g, "$1");
};

export const shopifyDateToVendDate = (date: string): string => {
  console.log(date);
  const dateArray = date.split("T");
  return `${dateArray[0]} ${dateArray[1].split("+")[0]}`;
};
