import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "EVapps - Your Smart EV Companion",
  description:
    "The ultimate companion for electric vehicle owners. Find stations, plan routes, and drive smarter with real-time data at your fingertips.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* TomTom Maps SDK CSS */}
        <link
          rel="stylesheet"
          type="text/css"
          href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/maps.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/css-styles/traffic-incidents.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.1/maps/css-styles/traffic-flow.css"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://api.tomtom.com/maps-sdk-for-web/cdn/plugins/SearchBox/2.2.4/SearchBox.css"
        />
      </head>
      <body className={poppins.className}>{children}</body>
    </html>
  )
}
