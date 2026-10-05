export function isItemIn<T>(item: T, itemsList: T[]) {
  return itemsList.some((i) => i === item);
}
