export const metadata = {
  title: 'Pantrio',
  description: 'AI Recipe Generator and meal planning app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
