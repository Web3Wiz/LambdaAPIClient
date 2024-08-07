import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Lambda API Client",
  description:
    "Lambda API Client to test Amazon Gateway API, Lambda API End Point, Cognito Token Authentication, DB API and DB Interface",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
