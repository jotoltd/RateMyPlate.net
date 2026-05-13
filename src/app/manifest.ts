import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rate My Plate",
    short_name: "RateMyPlate",
    description: "Share your food, get AI-powered ratings, and discover amazing plates from chefs around the world.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#f97316",
    orientation: "portrait",
    categories: ["food", "social", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshot-mobile.png", sizes: "390x844", type: "image/png", form_factor: "narrow" },
    ],
    shortcuts: [
      {
        name: "Upload a Plate",
        short_name: "Upload",
        description: "Share a new plate",
        url: "/upload",
      },
      {
        name: "Trending",
        short_name: "Trending",
        description: "See what's hot right now",
        url: "/trending",
      },
    ],
  };
}
