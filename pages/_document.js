import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#fffaf5" />
        <meta name="description" content="AI Recipe Generator - Turn pantry scraps into show-stopping meals" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
