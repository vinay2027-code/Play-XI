import type { FplRecommendationsResponse } from '../types/football';

export type RecommendationSnapshot = {
  version: 1;
  entryId: string;
  eventId: number;
  capturedAt: string;
  ideas: Array<{ outgoingId: number; incomingId: number; projectedGain: number }>;
};

function snapshotKey(entryId: string, eventId: number) {
  return `playxi-advice:${entryId}:${eventId}`;
}

export function saveFirstRecommendationSnapshot(entryId: string, recommendations: FplRecommendationsResponse): RecommendationSnapshot | null {
  if (!recommendations.freeIdeas.length) return null;
  try {
    const key = snapshotKey(entryId, recommendations.eventId);
    const saved = window.localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved) as RecommendationSnapshot;
      if (parsed.version === 1 && parsed.entryId === entryId && parsed.eventId === recommendations.eventId && Array.isArray(parsed.ideas)) return parsed;
    }
    const snapshot: RecommendationSnapshot = {
      version: 1,
      entryId,
      eventId: recommendations.eventId,
      capturedAt: new Date().toISOString(),
      ideas: recommendations.freeIdeas.map((idea) => ({
        outgoingId: idea.outgoing.id,
        incomingId: idea.incoming.id,
        projectedGain: idea.delta,
      })),
    };
    window.localStorage.setItem(key, JSON.stringify(snapshot));
    return snapshot;
  } catch {
    return null;
  }
}
