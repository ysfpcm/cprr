import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="container mx-auto max-w-7xl flex flex-col md:flex-row py-10 md:py-12 px-4 md:px-6">
        <div className="flex-1 mb-8 md:mb-0">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-red-600 p-1 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-white"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <span className="font-bold text-xl">Anytime CPR Health Services</span>
          </div>
          <p className="text-gray-500 max-w-md">
            Professional CPR, First Aid, and Life-Saving Training for Individuals and Organizations. Available anytime
            to help you meet your certification needs.
          </p>
          <div className="flex space-x-4 mt-6">
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-900">
              <Youtube className="h-5 w-5" />
              <span className="sr-only">YouTube</span>
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Services</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/schedule?service=bls" className="text-gray-500 hover:text-gray-900 text-sm">
                  BLS for Healthcare Providers
                </Link>
              </li>
              <li>
                <Link href="/schedule?service=cpr-non-healthcare" className="text-gray-500 hover:text-gray-900 text-sm">
                  CPR (Only) for Non-Healthcare Personnel
                </Link>
              </li>
              <li>
                <Link href="/schedule?service=cpr-first-aid" className="text-gray-500 hover:text-gray-900 text-sm">
                  CPR & First Aid
                </Link>
              </li>
              <li>
                <Link href="/schedule?service=first-aid" className="text-gray-500 hover:text-gray-900 text-sm">
                  First Aid
                </Link>
              </li>
              <li>
                <Link href="/schedule?service=babysitter" className="text-gray-500 hover:text-gray-900 text-sm">
                  Babysitter Course
                </Link>
              </li>
               <li>
                <Link href="/schedule?service=acls" className="text-gray-500 hover:text-gray-900 text-sm">
                  ACLS
                </Link>
              </li>
               <li>
                <Link href="/schedule?service=pals" className="text-gray-500 hover:text-gray-900 text-sm">
                  PALS
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-500 hover:text-gray-900 text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-500 hover:text-gray-900 text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-500 hover:text-gray-900 text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="text-gray-500 hover:text-gray-900 text-sm">
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="font-medium text-sm">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-500 hover:text-gray-900 text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-500 hover:text-gray-900 text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t py-6">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between px-4 md:px-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Anytime CPR & Health Services. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2 md:mt-0">
            <Link href="/legal-signature-notary" className="hover:underline">
              Legal Signature Notary LLC
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

