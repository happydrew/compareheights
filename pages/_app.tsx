import type { AppProps } from 'next/app'
import { type ReactElement, useEffect } from 'react'
import Head from 'next/head';
import '../style.css';
import Script from 'next/script';

export default function App({ Component, pageProps }: AppProps): ReactElement {
  // useEffect(() => {
  //   document.documentElement.classList.add('dark')
  // }, [])
  return (
    <>
      <Head>
        <meta name="saashub-verification" content="zm6rcf35ll2n" />
      </Head>
      {/* Google Tag Manager */}
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-BW33HHWP8V"></Script>
      <Script>
        {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-BW33HHWP8V');
        `}
      </Script>

      <Component {...pageProps} />
    </>)
}
