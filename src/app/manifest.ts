import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AfriJournal Index",
    short_name: "AJIF",
    description: "African Scientific Citation Impact Index Directory",
    start_url: "/",
    display: "standalone",
    background_color: "#121217",
    theme_color: "#d4a04a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon"
      }
    ]
  };
}
