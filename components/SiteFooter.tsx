import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <span>Lens by Talent Muscle, an EmergeFlow company</span>
        <Link href="/privacy">Privacy notice</Link>
      </div>
    </footer>
  );
}
