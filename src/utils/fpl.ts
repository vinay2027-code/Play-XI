import type { FplPlayer } from '../types/football';

export function formatFplPrice(value: number) {
  return `£${value.toFixed(1)}m`;
}

export function formatLocalDateTime(date: string | null, fallback: string) {
  if (!date) return fallback;
  return dateTimeFormatter.format(new Date(date));
}

export function fplAvailability(player: FplPlayer) {
  if (player.status === 'i') return 'Injured';
  if (player.status === 's') return 'Suspended';
  if (player.status === 'd') return `Doubt${player.chanceOfPlayingNext !== null ? ` · ${player.chanceOfPlayingNext}%` : ''}`;
  if (player.status === 'u') return 'Unavailable';
  return null;
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
