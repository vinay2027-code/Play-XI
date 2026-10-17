import { useEffect, useState } from 'react';
import type {
  FplBootstrap,
  FplFixture,
  FplFixturesResponse,
} from '../types/football';

export function useFootballData() {
  const [data, setData] = useState<FplBootstrap | null>(null);
  const [fixtures, setFixtures] = useState<FplFixture[]>([]);
  const [error, setError] = useState('');
  const [fixtureError, setFixtureError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCatalogue() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/fpl/bootstrap', {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok)
          throw new Error(payload.error || 'Could not load FPL players.');
        if (!controller.signal.aborted) setData(payload as FplBootstrap);
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load FPL players.',
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    async function loadFixtures() {
      setFixturesLoading(true);
      setFixtureError(false);
      setFixtures([]);
      try {
        const response = await fetch('/api/fpl/fixtures', {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Could not load fixtures.');
        const payload = (await response.json()) as FplFixturesResponse;
        if (!controller.signal.aborted) setFixtures(payload.fixtures);
      } catch {
        if (!controller.signal.aborted) setFixtureError(true);
      } finally {
        if (!controller.signal.aborted) setFixturesLoading(false);
      }
    }
    void loadCatalogue();
    void loadFixtures();
    return () => controller.abort();
  }, [revision]);
  return {
    data,
    fixtures,
    fixtureError,
    error,
    loading,
    fixturesLoading,
    refresh: () => setRevision((value) => value + 1),
  };
}
