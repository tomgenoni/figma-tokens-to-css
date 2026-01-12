import '@/styles/global.css';
import '@/styles/generated/pdl.css';

// Tailwind CSS configs
import '@/styles/tailwind-categories.css';
import '@/styles/generated/tailwind-pdl.css';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
