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
      {/* Reorganize for logical tab order */}
      <main className={styles.mainContent}>
        <AttractorCanvas />
        {/* Place toolbar before MenuSheet to ensure control buttons are encountered first in tab order */}
        <div
          role="toolbar"
          aria-label="Canvas controls"
          className={styles.toolbar}
        >
          {/* Order buttons by frequency of use and logical grouping */}
          <MenuToggleButton />
          <DownloadButton />
          <FullScreenButton />
          <DarkModeToggle />
        </div>
        {/* Move MenuSheet after the toolbar for a more logical tab order */}
        <MenuSheet />
      </main>
      <Footer />
    </>
  );
}
