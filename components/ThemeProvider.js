import theme from '../lib/theme'

export default function ThemeProvider({ children }) {
  const style = {
    '--accent': theme.colors.accent,
    '--accent-dark': theme.colors.accentDark
  }

  return <div style={style}>{children}</div>
}
