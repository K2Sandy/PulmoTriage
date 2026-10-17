import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import { UnduhProvider } from "./components/UnduhContext";

const fraunces = localFont({
  src: "./fonts/Fraunces.ttf",
  variable: "--font-fraunces-family",
  weight: "100 900",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const atkinsonNext = localFont({
  src: "./fonts/AtkinsonHyperlegibleNext.ttf",
  variable: "--font-atkinson-family",
  weight: "200 800",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const atkinsonMono = localFont({
  src: "./fonts/AtkinsonHyperlegibleMono.ttf",
  variable: "--font-mono-family",
  weight: "200 800",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata = {
  title: "PulmoTriage - Triase TBC untuk Puskesmas dan klinik",
  description:
    "Kenali PulmoTriage: alat bantu triase TBC dari rontgen dada yang berjalan tanpa internet. Lihat data persebaran dan unduh aplikasinya.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fraunces.variable} ${atkinsonNext.variable} ${atkinsonMono.variable} font-atkinson`}
    >
      <body className="min-h-screen bg-bg text-ink font-atkinson flex flex-col antialiased">
        <UnduhProvider>
          <Header />
          <div className="w-full flex-1 flex flex-col overflow-x-hidden">{children}</div>
        </UnduhProvider>
      </body>
    </html>
  );
}
