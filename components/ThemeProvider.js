import theme from '../lib/theme'

export default function ThemeProvider({ children }) {
  const style = {
    '--accent': theme.colors.accent,
    '--accent-dark': theme.colors.accentDark,
    '--accent-soft': theme.colors.accentSoft,
    '--secondary': theme.colors.secondary,
    '--secondary-dark': theme.colors.secondaryDark,
    '--bg': theme.colors.bg,
    '--text': theme.colors.text,
    '--muted': theme.colors.muted,
    '--accent-rgb': theme.colors.accentRgb,
    '--secondary-rgb': theme.colors.secondaryRgb,
  }

  return <div style={style}>{children}</div>
}
