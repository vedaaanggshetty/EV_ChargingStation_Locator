import Link from "next/link"

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <Link href="/" className="logo">
          EV<span>apps</span>
        </Link>
        <p>© 2025 EVapps. All Rights Reserved.</p>
      </div>
    </footer>
  )
}
