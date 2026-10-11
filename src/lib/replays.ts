export type MatchResult = "win" | "loss" | "draw";

export interface PlayerInfo {
  name: string;
  stars: number | null;
  rank: number | null;
}

export interface MatchDetails {
  endUtc: string | null;
  messageCount: number | null;
  turnCount: number | null;
  seat: number | null;
  appVersion: string;
  level: string;
  me: PlayerInfo | null;
  opponent: PlayerInfo | null;
  ally: PlayerInfo | null;
  teamId: number | null;
}

export interface MatchRecord {
  id: string;
  startUtc: string;
  durationMs: number;
  gameMode: number;
  result: MatchResult;
  opponentName: string;
  opponentIsAi: boolean;
  opponentStars: number | null;
  myCardIds: string[];
  opponentCardIds: string[];
  details?: MatchDetails;
}

const MATCHES_STORAGE_KEY = "spam-deck-lab:matches:v1";
const MAX_STORED_MATCHES = 30;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cardIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length <= 64))]
    .slice(0, 4);
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toPlayer(value: unknown): PlayerInfo | null {
  if (!isRecord(value) || typeof value.username !== "string" || !value.username) return null;
  return { name: value.username.slice(0, 40), stars: finiteNumber(value.stars), rank: finiteNumber(value.rank) };
}

function toDetails(entry: Record<string, unknown>, loading: Record<string, unknown> | null): MatchDetails {
  return {
    endUtc: typeof entry.EndUtc === "string" && Number.isFinite(Date.parse(entry.EndUtc)) ? entry.EndUtc : null,
    messageCount: finiteNumber(entry.MessageCount),
    turnCount: finiteNumber(entry.TurnCount),
    seat: finiteNumber(entry.Seat),
    appVersion: typeof entry.AppVersion === "string" ? entry.AppVersion.slice(0, 20) : "",
    level: typeof entry.Level === "string" ? entry.Level.slice(0, 40) : "",
    me: toPlayer(loading?.me),
    opponent: toPlayer(loading?.opponent),
    ally: toPlayer(loading?.ally),
    teamId: finiteNumber(loading?.team_id),
  };
}

function toMatch(entry: unknown): MatchRecord | null {
  if (!isRecord(entry)) return null;
  const { GameUid, StartUtc, DurationMs, GameMode, AccountId, WinnerId, IsDraw, OpponentName, OpponentIsAi } = entry;
  if (typeof GameUid !== "string" || typeof StartUtc !== "string" || !Number.isFinite(Date.parse(StartUtc))) {
    return null;
  }
  const myCardIds = cardIds(entry.MyCards);
  const opponentCardIds = cardIds(entry.OpponentCards);
  if (!myCardIds.length && !opponentCardIds.length) return null;

  const loading = isRecord(entry.Loading) ? entry.Loading : null;
  const opponent = loading && isRecord(loading.opponent) ? loading.opponent : null;
  const stars = opponent && typeof opponent.stars === "number" ? opponent.stars : null;

  let result: MatchResult = "draw";
  if (IsDraw !== true && typeof WinnerId === "string" && WinnerId) {
    result = WinnerId === AccountId ? "win" : "loss";
  }

  return {
    id: GameUid.slice(0, 64),
    startUtc: StartUtc,
    durationMs: typeof DurationMs === "number" && Number.isFinite(DurationMs) ? DurationMs : 0,
    gameMode: typeof GameMode === "number" && Number.isFinite(GameMode) ? GameMode : 0,
    result,
    opponentName: typeof OpponentName === "string" ? OpponentName.slice(0, 40) : "",
    opponentIsAi: OpponentIsAi === true,
    opponentStars: stars,
    myCardIds,
    opponentCardIds,
    details: toDetails(entry, loading),
  };
}

/** Parses the game's replay index; session tickets and account ids are deliberately dropped. */
export function parseReplayIndex(text: string): MatchRecord[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  const matches = data.map(toMatch).filter((match): match is MatchRecord => match !== null);
  return matches.length ? matches : null;
}

export function mergeMatches(current: MatchRecord[], incoming: MatchRecord[]): MatchRecord[] {
  const byId = new Map<string, MatchRecord>();
  [...current, ...incoming].forEach((match) => byId.set(match.id, match));
  return [...byId.values()]
    .sort((a, b) => Date.parse(b.startUtc) - Date.parse(a.startUtc))
    .slice(0, MAX_STORED_MATCHES);
}

export function loadStoredMatches(): MatchRecord[] {
  try {
    const raw = window.localStorage.getItem(MATCHES_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isStoredMatch);
  } catch {
    return [];
  }
}

export function storeMatches(matches: MatchRecord[]): boolean {
  try {
    window.localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredMatches() {
  try {
    window.localStorage.removeItem(MATCHES_STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

function isStoredMatch(value: unknown): value is MatchRecord {
  if (!isRecord(value)) return false;
  const isIds = (ids: unknown) =>
    Array.isArray(ids) && ids.length <= 4 && ids.every((id) => typeof id === "string");
  return (
    typeof value.id === "string" &&
    typeof value.startUtc === "string" &&
    Number.isFinite(Date.parse(value.startUtc)) &&
    typeof value.durationMs === "number" &&
    typeof value.gameMode === "number" &&
    (value.result === "win" || value.result === "loss" || value.result === "draw") &&
    typeof value.opponentName === "string" &&
    typeof value.opponentIsAi === "boolean" &&
    (value.opponentStars === null || typeof value.opponentStars === "number") &&
    isIds(value.myCardIds) &&
    isIds(value.opponentCardIds) &&
    (value.details === undefined || isStoredDetails(value.details))
  );
}

function isStoredPlayer(value: unknown): boolean {
  return value === null || (
    isRecord(value) &&
    typeof value.name === "string" &&
    (value.stars === null || typeof value.stars === "number") &&
    (value.rank === null || typeof value.rank === "number")
  );
}

function isStoredDetails(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const nullableNumber = (item: unknown) => item === null || typeof item === "number";
  return (
    (value.endUtc === null || typeof value.endUtc === "string") &&
    nullableNumber(value.messageCount) &&
    nullableNumber(value.turnCount) &&
    nullableNumber(value.seat) &&
    nullableNumber(value.teamId) &&
    typeof value.appVersion === "string" &&
    typeof value.level === "string" &&
    isStoredPlayer(value.me) &&
    isStoredPlayer(value.opponent) &&
    isStoredPlayer(value.ally)
  );
}
