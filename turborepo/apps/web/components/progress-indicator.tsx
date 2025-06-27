"use client";
import React from "react";
import styles from "./progress-indicator.module.css";
import { useAttractorStore } from "../../../packages/state/attractor-store";

export function ProgressIndicator() {
  const progress = useAttractorStore((s) => s.progress);
  return (
    <div className={styles.progressBarContainer}>
      <div
        className={styles.progressBar}
        style={{ width: `${Math.round(progress)}%` }}
      />
    </div>
  );
}
