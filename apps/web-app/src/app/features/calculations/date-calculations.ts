export function calculateDateFromNow(minutesToAdd: number) {
  return addToDate(new Date(), minutesToAdd);
}

export function addToDate(date: Date, minutesToAdd: number) {
    return new Date(date.getTime() + minutesToAdd * 60000);
}
