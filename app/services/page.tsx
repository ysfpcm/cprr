"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Award, BookOpen, Clock, Heart, Shield, Users } from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      icon: Heart,
      title: "CPR Training",
      description: "Learn life-saving CPR for healthcare providers",
      features: [
        "Adult, Child, and Infant CPR",
        "Hands-on practice with mannequins",
        "AED (Automated External Defibrillator) training",
        "2-year certification upon completion",
      ],
    },
    {
      icon: Award,
      title: "BLS Certification",
      description: "Basic Life Support for healthcare professionals",
      features: [
        "Advanced CPR techniques",
        "Airway management",
        "Team-based resuscitation",
        "Healthcare provider certification",
      ],
    },
    {
      icon: Shield,
      title: "First Aid Certification",
      description: "Comprehensive first aid training for workplace safety",
      features: [
        "Wound care and bleeding control",
        "Burn treatment and bandaging techniques",
        "Fracture and sprain management",
        "Emergency response protocols",
      ],
    },
    {
      icon: BookOpen,
      title: "Pediatric Training",
      description: "Specialized training for infant and child emergencies",
      features: [
        "Infant and child CPR techniques",
        "Choking management for children",
        "Pediatric first aid",
        "Child safety education",
      ],
    },
    {
      icon: Users,
      title: "Corporate Training",
      description: "Customized training for businesses and organizations",
      features: [
        "On-site training at your location",
        "Group discounts available",
        "Flexible scheduling for your team",
        "Compliance with industry regulations",
      ],
    },
    {
      icon: Clock,
      title: "Babysitter Course",
      description: "Essential skills for babysitters and childcare providers",
      features: [
        "Child CPR and first aid",
        "Child safety and supervision",
        "Basic childcare techniques",
        "Emergency response for childcare",
      ],
    },
  ]

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
                Comprehensive life-saving training programs for individuals and organizations
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                className="flex flex-col h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="p-6">
                  <div className="p-2 bg-red-100 rounded-full w-fit mb-3">
                    <service.icon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold">{service.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                  <ul className="space-y-2 text-sm mt-4">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-red-600"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto p-6 pt-0">
                  <Link
                    href={`/schedule?service=${service.title.toLowerCase().replace(/ /g, '-')}`}
                    className="inline-flex w-full h-10 items-center justify-center rounded-md bg-red-600 px-4 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
                  >
                    Schedule Training
                  </Link>
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
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Need a Custom Training Solution?
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                We can tailor our training programs to meet your specific needs and requirements.
              </p>
            </div>
            <div className="space-x-4 pt-4">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-md bg-red-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-red-700"
              >
                Contact Us
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-8 text-sm font-medium text-gray-900 shadow-sm transition-colors hover:bg-gray-100"
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

