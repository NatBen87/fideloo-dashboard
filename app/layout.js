import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastContainer from "./components/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Fideloo — Carte fidélité digitale",
    template: "%s | Fideloo",
  },
  description: "Gérez votre programme de fidélité simplement avec Fideloo.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⭐</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
