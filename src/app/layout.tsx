import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#07111e" },
  ],
};

export const metadata: Metadata = {
  title: "Dire Dawa University — Digital Clearance Management System (DDU DCMS)",
  description:
    "Official digital clearance portal of Dire Dawa University (Dire Dawa, Ethiopia). Streamline university clearance across academic advisors, library, dormitories, cafeteria, sports, security, finance, and the registrar without paper forms.",
  keywords: [
    "Dire Dawa University",
    "DDU",
    "DCMS",
    "Digital Clearance Management System",
    "Ethiopian University Clearance",
    "Student Clearance Ethiopia",
    "DDU Registrar",
    "Academic Clearance Portal",
  ],
  authors: [{ name: "Dire Dawa University ICT Directorate & Office of the Registrar" }],
  openGraph: {
    title: "Dire Dawa University — Digital Clearance Management System (DDU DCMS)",
    description:
      "Paperless, multi-department academic clearance for graduating and withdrawing students at Dire Dawa University.",
    type: "website",
    locale: "en_US",
    siteName: "DDU DCMS",
  },
};

const themeInitScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('ddu-theme');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = storedTheme === 'dark' || ((!storedTheme || storedTheme === 'system') && systemDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-[#07111e] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
