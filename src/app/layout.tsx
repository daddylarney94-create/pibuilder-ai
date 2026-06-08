import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PiBuilder AI — GPIO Project Generator',
  description: 'Build Raspberry Pi projects with automatic GPIO assignment, wiring diagrams, Python code, and AI-powered project generation.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PiBuilder AI',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    title: 'PiBuilder AI',
    description: 'Raspberry Pi GPIO project generator with AI assistant',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#030a05] text-[#e2f8eb] font-mono antialiased">
        {children}
      </body>
    </html>
  )
}
