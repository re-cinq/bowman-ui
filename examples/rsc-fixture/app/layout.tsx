import type { ReactNode } from "react";
import "@re-cinq/bowman-ui/styles.css";

export const metadata = {
  title: "bowman-ui RSC fixture",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
