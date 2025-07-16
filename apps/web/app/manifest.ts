import type { MetadataRoute } from "next";

// This is required for static export
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clifford & de Jong Attractor",
    short_name: "Attractor",
    description: "Explore Clifford and de Jong attractors interactively.",
    start_url: "/",
    display: "standalone",
    background_color: "#18181b",
    theme_color: "#18181b",
    icons: [
      // Android icons
      {
        src: "/icons/android/android-launchericon-48-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icons/android/android-launchericon-72-72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/android/android-launchericon-96-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/android/android-launchericon-144-144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/android/android-launchericon-192-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android/android-launchericon-512-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
