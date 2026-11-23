import './globals.css';

export const metadata = {
  metadataBase: new URL('https://silentstride.co.ke'),
  title: 'Silent Strides Network — Command Center',
  description: 'Multi-subsidiary accounting, equity and commission tracking for Silent Strides Network Ltd.',
  openGraph: {
    title: 'Silent Strides Network Ltd.',
    description: 'Multi-subsidiary accounting, equity and commission tracking',
    siteName: 'Silent Strides Network',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silent Strides Network Ltd.',
    description: 'Multi-subsidiary accounting, equity and commission tracking',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
