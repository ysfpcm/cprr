"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Award, Clock, Heart, Shield, Users } from "lucide-react"

export default function AboutPage() {
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
                About Anytime CPR
              </h1>
              <p className="mx-auto max-w-[700px] text-white md:text-xl">
                Our mission is to empower individuals with life-saving skills through quality training and education.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Our Story</h2>
              <p className="text-gray-500">
                Anytime CPR was founded with a simple but powerful mission: to make life-saving training accessible to
                everyone. Our founder, a healthcare professional with over 20 years of experience, recognized the
                critical need for quality CPR and first aid training in our community.
              </p>
              <p className="text-gray-500">
                What started as a small operation has grown into a trusted provider of comprehensive health and safety
                training services. We&apos;re proud to have trained thousands of individuals and organizations, equipping
                them with the skills and confidence to respond effectively in emergency situations.
              </p>
              <p className="text-gray-500">
                Today, Anytime CPR continues to expand its offerings while maintaining our commitment to excellence,
                accessibility, and personalized instruction.
              </p>
            </motion.div>
            <motion.div
              className="relative h-[400px] overflow-hidden rounded-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="CPR training session"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Core Values</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              The principles that guide everything we do at Anytime CPR.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Excellence",
                description:
                  "We are committed to providing the highest quality training that exceeds industry standards and prepares our students for real-world emergencies.",
              },
              {
                icon: Users,
                title: "Accessibility",
                description:
                  "We believe life-saving skills should be available to everyone, regardless of background or experience level. Our flexible scheduling and diverse course offerings reflect this commitment.",
              },
              {
                icon: Shield,
                title: "Integrity",
                description:
                  "We operate with honesty, transparency, and ethical practices in all aspects of our business, from instruction to certification.",
              },
              {
                icon: Award,
                title: "Expertise",
                description:
                  "Our instructors are experienced professionals with extensive knowledge in emergency response and healthcare, ensuring you learn from the best.",
              },
              {
                icon: Clock,
                title: "Adaptability",
                description:
                  "We continuously update our curriculum to reflect the latest research, guidelines, and best practices in emergency care and response.",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "We are dedicated to serving our community by increasing the number of individuals prepared to respond effectively in emergency situations.",
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                className="flex flex-col items-center space-y-2 rounded-lg border border-gray-200 bg-white p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-2 bg-red-100 rounded-full">
                  <value.icon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold">{value.title}</h3>
                <p className="text-sm text-gray-500">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Instructors</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Meet our team of certified professionals dedicated to providing exceptional training.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Sarah Thompson",
                title: "Lead CPR Instructor",
                bio: "Former ER nurse with 15+ years of experience in emergency medicine. Certified in Advanced Cardiac Life Support and Pediatric Advanced Life Support.",
              },
              {
                name: "Michael Rodriguez",
                title: "First Aid Specialist",
                bio: "Former paramedic with extensive experience in emergency response. Specializes in workplace safety and first aid training for corporate clients.",
              },
              {
                name: "Dr. James Chen",
                title: "BLS Instructor",
                bio: "Board-certified physician with a passion for medical education. Specializes in training healthcare professionals in advanced life support techniques.",
              },
            ].map((instructor, index) => (
              <motion.div
                key={instructor.name}
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="relative h-40 w-40 overflow-hidden rounded-full">
                  <Image
                    src="/placeholder.svg?height=160&width=160"
                    alt={instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{instructor.name}</h3>
                  <p className="text-sm text-gray-500">{instructor.title}</p>
                  <p className="mt-2 text-sm text-gray-500">{instructor.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Started?</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Join the thousands of individuals and organizations who have trusted Anytime CPR for their training
                needs.
              </p>
            </div>
            <div className="space-x-4 pt-4">
              <Link
                href="/schedule"
                className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
              >
                Schedule a Class
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

