import type { Metadata } from 'next'
// app/layout.tsx
import './globals.css' // correct relative path


export const metadata: Metadata = {
  title: 'Ev Charging Station Finder',
  keywords: ['ev', 'charging', 'station', 'finder', 'nextjs', 'react', 'tailwindcss'],
  authors: [{ name: 'Royston Dsouza', url: '' }],
  creator: 'Royston Dsouza',
  openGraph: {
    title: 'Ev Charging Station Finder',
    description: 'Find EV charging stations near you with ease.',
    url: 'https://evclf.com',
    siteName: 'Ev Charging Station Finder',},
  description: 'Find EV charging stations near you with ease.',
  generator: 'Next.js',
  applicationName: 'Ev Charging Station Finder',
    
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
