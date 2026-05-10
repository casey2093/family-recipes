import type { Metadata, Viewport } from "next";
import { Playfair_Display, Nunito } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";
import { AuthorsProvider } from "@/context/AuthorsContext";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Ware Family Kitchen",
  description: "A lovingly curated collection of our family's favorite recipes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${nunito.variable} antialiased`}>
        <AuthProvider>
          <AuthorsProvider>
            <ModalProvider>
              <Navigation />
              <main className="min-h-screen pt-16">{children}</main>
            </ModalProvider>
          </AuthorsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
