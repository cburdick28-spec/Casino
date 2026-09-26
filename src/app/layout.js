import "./globals.css";

export const metadata = {
  title: "Cyber-Tycoon: Neon Casino",
  description:
    "A browser-based cyberpunk casino management sim — manage games, security, and reputation in a synthwave dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
