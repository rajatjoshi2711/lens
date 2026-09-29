import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        {/* Parent-brand lockup, kept at its 140px minimum width. */}
        <Image
          src="/brand/logo-horizontal.png"
          alt="Talent Muscle, an EmergeFlow company"
          width={1319}
          height={465}
          className="logo-tm"
          sizes="142px"
        />
        <Link href="/privacy">Privacy notice</Link>
      </div>
    </footer>
  );
}
