import Link from "next/link"
import { ArrowDown } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-text-content">
          <h1>
            Your Journey, <span className="highlight">Charged</span> & Seamless
          </h1>
          <p>
            The ultimate companion for electric vehicle owners. Find stations, plan routes, and drive smarter with
            real-time data at your fingertips.
          </p>
          <Link href="#features" className="btn btn-learn-more">
            Explore Features
            <ArrowDown className="w-5 h-5" />
          </Link>
        </div>
        <div className="hero-image-container">
          <Image
            src="image.png" // Using the provided image
            alt="White electric car at a charging station"
            width={800}
            height={500}
            priority
          />
        </div>
      </div>
    </section>
  )
}
