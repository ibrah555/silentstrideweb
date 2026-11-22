import './globals.css';

export const metadata = {
  metadataBase: new URL('https://silentstride.co.ke'),
  title: 'Silent Strides Network — Command Center',
  description: 'Multi-subsidiary accounting, equity and commission tracking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
