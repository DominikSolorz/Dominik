import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DS Stream Support",
  description: "Wpłaty, głosówki, alerty OBS i narzędzia dla twórców.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl"><body>{children}</body></html>;
}
