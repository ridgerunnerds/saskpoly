// Ported from cobol-screen-test/config.json
export const JAYS_CONFIG = {
  team: { id: 141, name: "Toronto Blue Jays", abbreviation: "TOR" },
  thresholds: {
    bet_jays: 0.60,
    bet_opp: 0.60,
    lean_jays: 0.55,
    lean_opp: 0.55,
    reliability_min: 0.50,
    edge_strong: 12.0,
    edge_moderate: 8.0,
    edge_lean: 5.0,
  },
  model: {
    home_field_advantage: 0.04,
    record: { max_adjustment: 0.15, scale_factor: 150.0 },
    pitching: {
      max_adjustment: 0.12,
      weights: { era: 0.08, whip: 0.10, k9: 0.008, bb9: 0.006, hr9: 0.005 },
    },
    bullpen: { max_adjustment: 0.05, era_weight: 0.03, whip_weight: 0.04 },
    momentum: { max_adjustment: 0.045, games_lookback: 5 },
    park_factor: { max_adjustment: 0.01, high_threshold: 1.05, low_threshold: 0.98 },
    weather: { max_adjustment: 0.015, wind_speed_threshold: 10, cold_temp_threshold: 45 },
    head_to_head: { max_adjustment: 0.04, scale_factor: 0.08 },
    probability_bounds: { min: 0.15, max: 0.85 },
    reliability: { games_denominator: 60, ip_denominator: 50, games_weight: 0.5, ip_weight: 0.5 },
  },
  hr_tracker: {
    recent_games: 7,
    base_multiplier: 30.0,
    wind_bonus: { "15mph": 20.0, "10mph": 12.0, "5mph": 4.0 },
    temp_bonus: { "85f": 8.0, "75f": 4.0, "65f": 2.0 },
  },
  runline: { favorite_cover_multiplier: 0.70, underdog_cover_multiplier: 0.30 },
};
