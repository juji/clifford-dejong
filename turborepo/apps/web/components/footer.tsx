import React from "react";
import styles from "./footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>Clifford-de Jong Attractor &copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
