// ============================================================================
// paxos-itinerary.js — deliberately empty for the Paxos destination.
//
// Day-by-day itinerary planning (specific times, drive/walk transitions,
// per-day themes) is not one of the Phase 2 sections this destination is
// meant to exercise, and inventing a plausible multi-day schedule would
// mean fabricating exactly the kind of precise, unverifiable detail (timed
// transitions, drive minutes between stops) this destination's own data
// policy avoids. The Itinerary tab already has a proven empty state (see
// data/destinations/empty.js, which uses the same convention) — showing it
// for a real destination with genuinely no authored itinerary yet is the
// honest choice, not an architecture gap.
// ============================================================================

window.PAXOS_ITINERARY_DAYS = [];
