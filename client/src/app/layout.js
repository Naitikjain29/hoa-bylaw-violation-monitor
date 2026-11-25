import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "HOA Bylaw Violation Visual Monitor",
  description: "AI-powered HOA compliance & automated citation system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}