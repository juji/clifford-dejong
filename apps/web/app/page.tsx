import { AttractorCanvas } from "@/components/attractor-canvas";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProgressIndicator } from "@/components/progress-indicator";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { FullScreenButton } from "@/components/full-screen-button";
import { MenuToggleButton } from "@/components/menu-toggle-button";
import { MenuSheet } from "@/components/menu-sheet";
import { DownloadButton } from "@/components/download-button";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <ProgressIndicator />
      <MenuSheet />
      <main className={styles.mainContent}>
        <AttractorCanvas />
        <div 
          role="toolbar" 
          aria-label="Canvas controls"
          className={styles.toolbar}
        >
          <DarkModeToggle />
          <FullScreenButton />
          <MenuToggleButton />
          <DownloadButton />
        </div>
      </main>
      <Footer />
    </>
  );
}
