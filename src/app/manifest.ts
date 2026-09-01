import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LÍDER Treinamentos",
    short_name: "LÍDER",
    description:
      "Plataforma de treinamentos em Normas Regulamentadoras (NR) da LÍDER.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ba0e31",
    icons: [
      {
        src: "/lider-mark.png",
        sizes: "512x506",
        type: "image/png",
      },
    ],
  };
}
