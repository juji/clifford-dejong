import React from "react";

export function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 w-full bg-[rgba(255,255,255,0.95)] text-[#222] py-3 px-4 text-[0.8rem] font-light border-t border-[#eee] z-[100] text-left dark:bg-[rgba(20,20,20,0.95)] dark:text-[#bbb] dark:border-[#333]">
      <span>Clifford-de Jong Attractor &copy; {new Date().getFullYear()}</span>
    </footer>
  );
}
