"use client"

import type React from "react"
import { useEffect } from "react"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { LoadingProvider, useLoading } from "@/components/loading-provider"
import { usePathname } from "next/navigation"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <LoadingProvider>
          <NavigationLoader>{children}</NavigationLoader>
        </LoadingProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

function NavigationLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    // Show loading when pathname changes (navigation starts)
    showLoading()

    // Hide loading after a short delay to allow the new page to render
    const timer = setTimeout(() => {
      hideLoading()
    }, 300); // Adjust delay as needed

    return () => clearTimeout(timer); // Clear timeout if component unmounts or pathname changes again
  }, [pathname, showLoading, hideLoading]);

  return <>{children}</>
}
