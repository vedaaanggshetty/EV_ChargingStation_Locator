"use client"

import Link from "next/link"
import { useState } from "react"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="container">
      <nav className="navbar">
        <Link href="/" className="logo">
          EV<span>apps</span>
        </Link>
        <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
          <li className="nav-item">
            <Link href="/" className="nav-link" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
              Contact
            </Link>
          </li>
        </ul>
        <div className="nav-buttons">
          <Link href="/signup" className="btn btn-signup">
            Sign Up
          </Link>
          <Link href="/signin" className="btn btn-signin">
            Sign In
          </Link>
        </div>
        <div className={`hamburger ${isOpen ? "active" : ""}`} onClick={() => setIsOpen(!isOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </nav>
    </header>
  )
}
