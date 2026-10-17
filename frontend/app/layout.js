import "./globals.css";

export const metadata = {
  title: "PulmoTriage",
  description: "Alat bantu triase TBC dari rontgen dada",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
