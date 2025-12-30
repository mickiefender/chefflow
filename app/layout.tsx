import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"



export const metadata: Metadata = {
  title: "ChefFlow - Restaurant Management System",
  description: "Complete restaurant management system with NFC menu, staff tracking, and admin dashboard",
    generator: 'Mickie'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
