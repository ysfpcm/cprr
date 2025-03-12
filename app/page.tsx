"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Award, Calendar, Clock, Heart, Users } from "lucide-react"

export default function Home() {
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
                Anytime CPR Health Services
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Professional CPR, First Aid, and Life-Saving Training for Individuals and Organizations
              </p>
            </div>
            <div className="space-x-4">
              <Link
                href="/services"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-red-600 shadow transition-colors hover:bg-gray-100"
              >
                View Our Services
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-md border border-white bg-transparent px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/10"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-2 bg-red-100 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">CPR Training</h3>
              <p className="text-gray-500">
                Learn life-saving CPR techniques from certified instructors. Available for healthcare professionals and
                the general public.
              </p>
            </motion.div>
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-2 bg-red-100 rounded-full">
                <Award className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">First Aid Certification</h3>
              <p className="text-gray-500">
                Comprehensive first aid training for workplace safety compliance and personal preparedness.
              </p>
            </motion.div>
            <motion.div
              className="flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="p-2 bg-red-100 rounded-full">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">Group & Corporate Training</h3>
              <p className="text-gray-500">
                Customized training sessions for businesses, schools, and organizations of all sizes.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Get Certified?</h2>
              <p className="text-gray-500 md:text-xl">
                Our flexible scheduling allows you to find a class that fits your busy life. Book a session today and
                gain the confidence to save lives.
              </p>
            </motion.div>
            <motion.div
              className="flex flex-col gap-2 min-[400px]:flex-row lg:justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/schedule"
                className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule a Class
              </Link>
              <Link
                href="/services"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
              >
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why Choose Anytime CPR?</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                We're committed to providing the highest quality training with flexible scheduling options.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 pt-8">
              <motion.div
                className="flex flex-col items-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <Award className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Certified Instructors</h3>
                <p className="text-gray-500">
                  All our instructors are certified professionals with extensive experience.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Flexible Scheduling</h3>
                <p className="text-gray-500">Classes available at your convenience, including evenings and weekends.</p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">Small Class Sizes</h3>
                <p className="text-gray-500">Personalized attention ensures you master life-saving techniques.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

