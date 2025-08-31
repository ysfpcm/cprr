"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"

export function SiteBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="w-full bg-yellow-100 border-b border-yellow-200">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-3">
        <div className="flex items-center justify-center text-center">
          <div className="flex-1 text-sm md:text-base font-semibold text-yellow-800">
            ⚠️ Training Update in Progress — Anytime CPR Health Services is revising our programs to ensure CPR and First Aid are taught the{" "}
            <em>right way</em>. Online booking is currently paused.{" "}
            <Link href="/contact" className="underline hover:text-yellow-900">
              Contact Us
            </Link>{" "}
            for updates.
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 text-yellow-600 hover:text-yellow-800 md:hidden"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
