import posthog from 'posthog-js';

// This is PostHog's public project token. Personal API keys belong only in PostHog/Shipped.
const PROJECT_TOKEN = 'phc_waaFe9MHVLzmGqnLYQe5DioYM4LbPHDAr4cCndJAjt9S';
let started = false;

export function startPostHog() {
  if (started) return;
  started = true;

  posthog.init(PROJECT_TOKEN, {
    api_host: 'https://us.i.posthog.com',
    defaults: '2026-08-30',
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    disable_session_recording: true,
    person_profiles: 'identified_only',
  });
  posthog.opt_in_capturing({ captureEventName: false });
  // Do not send OAuth callbacks, checkout parameters, or FPL Team IDs in URLs.
  posthog.capture('$pageview', {
    $current_url: `${window.location.origin}${window.location.pathname}`,
  });
}

export function trackScreen(screen: string) {
  if (started) posthog.capture('playxi_screen_viewed', { screen });
}

export function stopPostHog() {
  if (started) posthog.opt_out_capturing();
}
