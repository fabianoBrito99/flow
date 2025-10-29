// /components/NavMenu.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, DollarSign, Ticket } from "lucide-react";
import styles from "./NavMenu.module.css";

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className={styles.navMenu}>
      <Link
        href="/"
        className={`${styles.link} ${
          pathname === "/" ? styles.active : ""
        }`}
      >
        <Home className={styles.icon} />
        <span className={styles.label}>Home</span>
      </Link>

      <Link
        href="/inscricao"
        className={`${styles.link} ${
          pathname.startsWith("/inscricao") ? styles.active : ""
        }`}
      >
        <DollarSign className={styles.icon} />
        <span className={styles.label}>Inscrição</span>
      </Link>

      <Link
        href="/ingressos"
        className={`${styles.link} ${
          pathname.startsWith("/ingressos") ? styles.active : ""
        }`}
      >
        <Ticket className={styles.icon} />
        <p className={styles.label}>
          <span className={styles.label1}>Meus</span>Ingressos </p>
      </Link>
    </nav>
  );
}
