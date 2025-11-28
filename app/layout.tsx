import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        <AuthProvider>
          <div className="bg-[#040404] min-h-screen text-white">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
