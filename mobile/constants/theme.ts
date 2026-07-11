export const Theme = {
  light: {
    primary: '#0B2545',       // Deep Ocean Blue
    secondary: '#134074',     // Dark Blue
    accent: '#EE6C4D',        // Emergency Coral/Orange
    danger: '#FF4D4D',        // Bright Red for critical alerts
    warning: '#F4A261',       // Amber for medium warnings
    success: '#2A9D8F',       // Teal/Green for verified reports
    info: '#4EA8DE',          // Sky Blue
    background: '#F4F6F9',    // Light Gray Background
    surface: '#FFFFFF',       // Card/Sheet White
    text: '#1D2A44',          // Dark Slate text
    textSecondary: '#64748B', // Muted gray text
    border: '#E2E8F0',        // Subtle divider gray
    cardBg: '#FFFFFF',
    inputBg: '#F8FAFC'
  },
  dark: {
    primary: '#1D3557',       // Muted Dark Ocean Blue
    secondary: '#457B9D',     // Slate Teal
    accent: '#EE6C4D',        // Emergency Coral/Orange (stays vibrant)
    danger: '#FF6B6B',        // Vibrant Red
    warning: '#F4A261',       // Amber
    success: '#2EC4B6',       // Electric Teal
    info: '#A8DADC',          // Light Slate Blue
    background: '#0B132B',    // Near Black Deep Blue
    surface: '#1C2541',       // Deep Blue Card Surface
    text: '#F1F5F9',          // Off White Text
    textSecondary: '#94A3B8', // Muted slate gray text
    border: '#334155',        // Dark border slate
    cardBg: '#1C2541',
    inputBg: '#0B132B'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22
    },
    bodySm: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 18
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const
    }
  }
};
