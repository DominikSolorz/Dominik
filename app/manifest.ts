import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DS Stream Support",
    short_name: "DS Support",
    description: "Wpłaty, głosówki i alerty OBS dla twórców.",
    start_url: "/",
    display: "standalone",
    background_color: "#070b16",
    theme_color: "#7c3aed",
    lang: "pl-PL",
  };
}
