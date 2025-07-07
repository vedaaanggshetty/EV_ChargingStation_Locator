import Link from "next/link"
import { MapPin, Route, Car, Brain } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        <h2 className="section-title">Everything You Need In One App</h2>
        <div className="feature-cards-container">
          {/* Feature Card 1: Search */}
          <div className="feature-card">
            <div className="card-icon">
              <MapPin className="w-8 h-8" />
            </div>
            <Link href="/ev-search" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="card-text-content">
                <h3>Search for Stations</h3>
                <p>Quickly locate charging stations based on location, connector type, and real-time availability.</p>
              </div>
            </Link>
          </div>
          {/* Feature Card 2: Route */}
          <div className="feature-card">
            <div className="card-icon">
              <Route className="w-8 h-8" />
            </div>
            <Link href="/ev-routing" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="card-text-content">
                <h3>Route to Station</h3>
                <p>Get turn-by-turn directions to your chosen charging station for a hassle-free arrival.</p>
              </div>
            </Link>
          </div>
          {/* Feature Card 3: Traffic */}
          <div className="feature-card">
            <div className="card-icon">
              <Car className="w-8 h-8" />
            </div>
            <Link href="/traffic" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="card-text-content">
                <h3>Find Traffic</h3>
                <p>Stay informed about traffic conditions along your route to avoid delays and save time.</p>
              </div>
            </Link>
          </div>
          {/* Feature Card 4: Predict (New) */}
          <div className="feature-card">
            <div className="card-icon">
              <Brain className="w-8 h-8" />
            </div>
            <Link href="/predict" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div className="card-text-content">
                <h3>Predict EV Performance</h3>
                <p>Utilize AI to predict battery consumption and optimal charging stops for your journey.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
