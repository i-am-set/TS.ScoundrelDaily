export const GameConfig = {
  audio: {
    masterVolume: 0.5,
  },
  colors: {
    background: 0x0f172a,
    cardBackground: 0xe2e8f0,
    cardBack: 0x1e293b,
    cardStroke: 0x64748b,
    cardShadow: 0x000000,
    textLight: 0xf8fafc,

    ui: {
      healthRed: 0xf87171,
      healthGreen: 0x4ade80,
      healthOrange: 0xfbbf24,
      healthGray: 0x94a3b8,

      avoidActive: 0xfacc15,
      avoidDisabled: 0x475569,

      highlight: 0x38bdf8,
      hoverHighlight: 0xfacc15,

      overlay: 0x020617,

      buttonBg: 0x1e293b,
      buttonHover: 0x334155,
    },

    suits: {
      hearts: 0xef4444,
      diamonds: 0x22c55e,
      spades: 0x0f172a,
      clubs: 0x0f172a,
    },
  },

  card: {
    width: 140,
    height: 196,
    radius: 12,
  },

  juice: {
    scaleNormal: 1.0,
    scaleHover: 1.05,
    scaleFocus: 1.1,
    shadowYNormal: 8,
    shadowYHover: 16,
    shadowYFocus: 20,
    shadowAlphaNormal: 0.4,
    shadowAlphaHover: 0.2,
    shadowAlphaFocus: 0.15,
    lerpSpeed: 0.2,
    flipSpeed: 0.3,
    scoringDelayStart: 125,
    scoringDelayMonster: 75,
    scoringDelayDiscard: 25,
  },
};
