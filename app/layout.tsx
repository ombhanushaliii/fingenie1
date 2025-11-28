import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="bg-[#0a0a0a] min-h-screen text-gray-100 selection:bg-white/20">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
