"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ShoppingCart,
  Users,
  BarChart3,
  Smartphone,
  CheckCircle2,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import Image from "next/image"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">ChefFlow</h1>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex gap-6 text-sm font-medium text-slate-600">
              <Link href="#features" className="hover:text-slate-900 transition">
                Features
              </Link>
              <Link href="#" className="hover:text-slate-900 transition">
                Pricing
              </Link>
              <Link href="#" className="hover:text-slate-900 transition">
                Resources
              </Link>
              <Link href="#" className="hover:text-slate-900 transition">
                Contact
              </Link>
            </div>
            <Link href="/auth/login">
              <Button variant="outline" className="border-slate-300 bg-transparent">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-slate-900 hover:bg-slate-800">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span className="text-sm font-medium text-purple-900">New: Real-time Kitchen Integration</span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900">
            Real-time{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              restaurant
            </span>{" "}
            management
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            From NFC menu ordering to kitchen tracking, our integrated platform provides complete visibility into your
            restaurant operations with real-time data.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-slate-900 hover:bg-slate-800">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-slate-300 bg-transparent">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Trusted by Section */}
        <div className="mt-20 pt-12 border-t border-slate-200">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wide mb-8">
            Trusted by leading restaurants
          </p>
          <div className="overflow-hidden">
            <div className="animate-scroll flex gap-12 md:gap-16 items-center">
              {/* Original set of restaurants */}
              {[
                { name: "Baltic Cousine", src: "/images/logo/Blue_Minimalist_Real_Estate_Logo-removebg-preview.png" },
                { name: "Urban Eats", src: "/images/logo/Brown_and_White_SImple_Modern_Professional_Catering_Logo-removebg-preview.png" },
                { name: "Olivia's Kitchen", src: "/images/logo/Olivia's kitchen.png" },
                { name: "Rimberio", src: "/images/logo/Rimberio.png" },
               
                // Duplicate set for seamless loop
               { name: "Baltic Cousine", src: "/images/logo/Blue_Minimalist_Real_Estate_Logo-removebg-preview.png" },
                { name: "Urban Eats", src: "/images/logo/Brown_and_White_SImple_Modern_Professional_Catering_Logo-removebg-preview.png" },
                { name: "Olivia's Kitchen", src: "/images/logo/Olivia's kitchen.png" },
                { name: "Rimberio", src: "/images/logo/Rimberio.png" },
              ].map((restaurant, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Image
                    src={restaurant.src || "/placeholder.svg"}
                    alt={restaurant.name}
                    width={120}
                    height={60}
                    className="h-12 w-auto object-contain"
                  />
                  <p className="text-sm font-medium text-slate-600 text-center whitespace-nowrap">{restaurant.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Showcase Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">
            Your all-in-one{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              restaurant dashboard
            </span>
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Monitor every aspect of your restaurant operations from a single, intuitive interface
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
            {/* Main Dashboard Preview */}
            <div>
              <div className="relative rounded-lg overflow-hidden bg-slate-100 border border-slate-300">
                <Image
                  src="/images/homepage_images/Real-time Metrics Dashboard.png"
                  alt="ChefFlow Dashboard Preview"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Dashboard Features */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Real-time Metrics Dashboard</h4>
                <p className="text-slate-600">
                  Track orders, revenue, and staff performance with live-updating charts and key performance indicators.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">1,250</div>
                  <p className="text-sm text-slate-600">Orders Today</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">GH¢40,852</div>
                  <p className="text-sm text-slate-600">Revenue</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">98%</div>
                  <p className="text-sm text-slate-600">Order Accuracy</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">12 min</div>
                  <p className="text-sm text-slate-600">Avg. Wait Time</p>
                </div>
              </div>

              <Link href="/auth/login">
                <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                  View Full Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Kitchen Display System Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block mb-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Kitchen Operations
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Smart Kitchen Display System</h3>
            <p className="text-lg text-slate-600 mb-8">
              Orders are prioritized and displayed on kitchen screens in real-time, ensuring your kitchen team never
              falls behind. Color-coded priority system helps manage rush periods efficiently.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Instant Order Updates</h4>
                  <p className="text-slate-600 text-sm">Orders appear on screens the moment they're placed</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Preparation Time Tracking</h4>
                  <p className="text-slate-600 text-sm">Monitor how long each order has been in preparation</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-300">
            <Image
              src="/images/homepage_images/Smart Kitchen Display System.png"
              alt="Kitchen Display System"
              width={600}
              height={500}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>

      {/* Order Management Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-300">
            <Image
              src="/images/homepage_images/CHEFFLOW.jpg"
              alt="Order Management System"
              width={600}
              height={500}
              className="w-full h-auto"
            />
          </div>
          <div>
            <div className="inline-block mb-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Customer Experience
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">NFC-Powered Order Management</h3>
            <p className="text-lg text-slate-600 mb-8">
              Customers simply tap their phones on NFC cards placed at each table to access your digital menu. No app
              installation needed. They can browse, customize, and place orders instantly.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <Smartphone className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Zero Friction Ordering</h4>
                  <p className="text-slate-600 text-sm">Works with any NFC-enabled smartphone</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <TrendingUp className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Upsell Opportunities</h4>
                  <p className="text-slate-600 text-sm">Recommend specials and drinks at the point of order</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Analytics & Insights Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            Data & Insights
          </div>
          <h3 className="text-4xl font-bold text-slate-900 mb-4">Business Intelligence at Your Fingertips</h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive analytics help you understand customer behavior, optimize menu items, and grow revenue
          </p>
        </div>

        <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-300 mb-12">
          <Image
            src="/images/homepage_images/Business Intelligence at Your Fingertips.png"
            alt="Analytics Dashboard"
            width={1200}
            height={400}
            className="w-full h-auto"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Sales Analytics</h4>
            <p className="text-slate-600 text-sm">
              Track daily, weekly, and monthly revenue with detailed breakdowns by menu item and time period.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Customer Insights</h4>
            <p className="text-slate-600 text-sm">
              Understand peak hours, popular dishes, and customer preferences to optimize operations.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Performance Metrics</h4>
            <p className="text-slate-600 text-sm">
              Monitor order accuracy, average wait times, and staff productivity in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Compliance Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-purple-50 p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                Enterprise Security
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Bank-Grade Security</h3>
              <p className="text-lg text-slate-600 mb-8">
                Your restaurant data is protected with industry-leading encryption and security protocols.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">End-to-End Encryption</h4>
                    <p className="text-slate-600 text-sm">All data is encrypted in transit and at rest</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <Shield className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">Compliance Ready</h4>
                    <p className="text-slate-600 text-sm">GDPR, PCI-DSS, and SOC 2 compliant</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden bg-slate-100 border border-slate-300">
              <Image
                src="/images/homepage_images/End-to-End Encryption.jpg"
                alt="Security Dashboard"
                width={500}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Preview Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">
            Simple,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              transparent pricing
            </span>
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that works best for your restaurant
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition">
            <h4 className="text-xl font-semibold text-slate-900 mb-2">Starter</h4>
            <p className="text-slate-600 text-sm mb-6">Perfect for small restaurants</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">$99</span>
              <span className="text-slate-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Up to 5 staff members
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                NFC ordering
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Basic analytics
              </li>
            </ul>
            <Button className="w-full bg-slate-200 text-slate-900 hover:bg-slate-300">Get Started</Button>
          </div>

          <div className="rounded-lg border-2 border-purple-600 bg-white p-8 shadow-lg transform scale-105">
            <div className="inline-block mb-4 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
              MOST POPULAR
            </div>
            <h4 className="text-xl font-semibold text-slate-900 mb-2">Professional</h4>
            <p className="text-slate-600 text-sm mb-6">For growing restaurants</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">$199</span>
              <span className="text-slate-600">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Unlimited staff members
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                NFC & QR ordering
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Advanced analytics
              </li>
            </ul>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Get Started</Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition">
            <h4 className="text-xl font-semibold text-slate-900 mb-2">Enterprise</h4>
            <p className="text-slate-600 text-sm mb-6">For multi-location chains</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">Custom</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Multiple locations
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Priority support
              </li>
              <li className="flex gap-2 items-center text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Custom integrations
              </li>
            </ul>
            <Button variant="outline" className="w-full border-slate-300 bg-transparent">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-slate-900 mb-4">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              manage better
            </span>
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Designed specifically for restaurants, our platform streamlines operations from ordering to payment.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Feature 1 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">NFC Menu Ordering</h4>
              <p className="text-slate-600 mb-4">
                Customers tap their phones to NFC cards at tables to instantly view your digital menu and place orders
                without waiting for staff.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Instant order placement
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  No app download needed
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Real-time Order Tracking</h4>
              <p className="text-slate-600 mb-4">
                Orders are instantly transmitted to the kitchen with live status updates, reducing preparation time and
                improving service.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Live kitchen display
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Order priority management
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Staff Management</h4>
              <p className="text-slate-600 mb-4">
                Track every action with individual staff credentials for complete accountability and comprehensive audit
                trails.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Shift scheduling
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Activity logging
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-slate-900 mb-2">Advanced Analytics</h4>
              <p className="text-slate-600 mb-4">
                Comprehensive reports on sales, performance metrics, customer behavior, and restaurant insights in one
                dashboard.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Real-time reports
                </li>
                <li className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Revenue insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-90"></div>
          <div className="relative px-8 md:px-12 py-16 text-center">
            <h3 className="text-4xl font-bold text-white mb-4">Transform Your Restaurant Today</h3>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants already streamlining operations with ChefFlow. Start your free 30-day trial
              today.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/20 bg-transparent"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-white mb-4">ChefFlow</h3>
              <p className="text-slate-400 text-sm">Modern restaurant management platform for the digital age</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2025 FoodOps. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
