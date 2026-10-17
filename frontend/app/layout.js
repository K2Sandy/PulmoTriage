import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";
import Toast from "./components/Toast";
import { SyncProvider } from "./context/SyncContext";

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
  title: "PulmoTriage - Triase TBC Rontgen Toraks",
  description: "Alat bantu triase TBC dari rontgen dada berbasis kecerdasan buatan untuk Puskesmas.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${fraunces.variable} ${atkinsonNext.variable} ${atkinsonMono.variable} font-atkinson`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme')||'system';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-ink font-atkinson flex flex-col antialiased">
        <SyncProvider>
          <Header />
          <div className="w-full flex-1 flex flex-col overflow-x-hidden">
            {children}
          </div>
          <Toast />
        </SyncProvider>
      </body>
    </html>
  );
}
