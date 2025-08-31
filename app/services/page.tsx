"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { AlertTriangle, Mail } from "lucide-react"

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-red-600">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
                Our Services
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Comprehensive life-saving training programs organized by your needs
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Training Update Notice Section */}
      <section className="w-full py-12 md:py-16 bg-gray-50">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-12 w-12 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900 mb-4">
              Training Update in Progress
            </h2>
          </motion.div>
          
          <motion.div
            className="bg-white rounded-lg shadow-lg p-8 md:p-12 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  At Anytime CPR Health Services, we believe CPR and First Aid should be taught the{" "}
                  <em className="font-semibold text-gray-900">right way</em>. We are in the process of revising our programs to reflect this standard.
                </p>
                
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  While online booking is paused, we invite you to{" "}
                  <Link href="/contact" className="text-red-600 hover:text-red-700 underline font-medium">
                    contact us
                  </Link>{" "}
                  with questions or to be notified when classes resume.
                </p>
              </div>
              
              <div className="pt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-8 py-3 text-base font-medium text-white shadow transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Us for Updates
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Custom Training Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white border-t border-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-4 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
                Custom Training Solutions
              </h2>
              <p className="text-lg text-gray-600 md:text-xl">
                Need specialized training for your organization? We can tailor our programs to meet your specific requirements, 
                including on-site training, custom schedules, and industry-specific certifications.
              </p>
            </div>
            
            <div className="space-x-4 pt-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Contact Us for Custom Training
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Learn More About Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

