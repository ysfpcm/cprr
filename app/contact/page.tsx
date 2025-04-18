"use client"

import React from 'react';
import { motion } from "framer-motion"
import { Mail, MapPin, Phone } from "lucide-react"

const ContactPage: React.FC = () => {
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
                Contact Us
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Have questions or ready to schedule your training? Get in touch with us today.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex justify-center">
            <motion.div
              className="space-y-8 max-w-lg w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tighter text-center">Get In Touch</h2>
                <p className="text-gray-600 mt-3 text-center px-6"> 
                  Your satisfaction is our top priority. We are committed to providing excellent customer service. Please let us know how we can assist you.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <p className="text-sm text-gray-500 mb-4">Reach out to us directly</p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Phone className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Phone</h4>
                      <a href="tel:+13463420079" className="text-sm text-gray-500 hover:text-red-700">
                        1 (346) 342-0079 
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Mail className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <a href="mailto:info@anytimecprhealthservices.com" className="text-sm text-gray-500 hover:text-red-700">
                        info@anytimecprhealthservices.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-sm text-gray-500">
                        PO Box 11290
                        <br />
                        Spring, TX 77379 
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ContactPage

