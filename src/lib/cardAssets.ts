export const API_ROOT = "https://spamgame.com/data/";

export function imageUrl(path: string): string {
  return `${API_ROOT}${path}`;
}
