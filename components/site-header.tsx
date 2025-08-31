"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"

import { MainNav } from "@/components/main-nav"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{ backgroundColor: '#FAF4EA' }}>
      <div className="container mx-auto max-w-7xl flex h-16 items-center px-4 md:px-6">
        <div className="flex items-center space-x-2">
          <div className="relative w-12 h-12">
            <Image
              src="/logo.PNG"
              alt="Anytime CPR Health Services Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-lg font-bold text-gray-900 hidden md:block">
            Anytime CPR Health Services
          </span>
        </div>
        
        <div className="flex-1 flex justify-center">
          <MainNav className="hidden md:flex" />
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-2">
            <Link
              href="/contact"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
            >
              Contact Us
            </Link>
            <Link
              href="/schedule"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-gray-400 px-4 text-sm font-medium text-white shadow cursor-not-allowed"
            >
              Schedule a Class
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </button>
          </nav>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 top-16 z-50 bg-white md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100vh - 4rem)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col gap-4 p-6">
              <Link href="/" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/services" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                Services
              </Link>
              <Link href="/about" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                About
              </Link>
              <Link href="/schedule" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                Schedule
              </Link>
              <Link href="/contact" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
              <Link
                href="/schedule"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-gray-400 px-4 text-sm font-medium text-white shadow cursor-not-allowed"
                onClick={() => setMobileMenuOpen(false)}
              >
                Schedule a Class
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

