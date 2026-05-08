import type { Metadata } from "next";
import { Playfair_Display, Nunito } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ModalProvider } from "@/context/ModalContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ware Family Kitchen",
  description: "A lovingly curated collection of our family's favorite recipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${nunito.variable} antialiased`}>
        <ModalProvider>
          <Navigation />
          <main className="min-h-screen pt-16">{children}</main>
        </ModalProvider>
      </body>
    </html>
  );
}
