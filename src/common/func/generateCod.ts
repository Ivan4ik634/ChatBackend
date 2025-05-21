export function generateCode(): string {
  const length = 6;
  return Math.floor(Math.random() * 10 ** length)
    .toString()
    .padStart(length, '0');
}
