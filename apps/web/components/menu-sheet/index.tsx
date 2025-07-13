"use client"

import { BigMenu } from "./big-menu"
import { SmallMenu } from "./small-menu"
import styles from './menu-sheet.module.css'

export function MenuSheet() {

  return <>
    <SmallMenu className={styles.smallMenu} />
    <BigMenu className={styles.bigMenu} />
  </>
}
