import type { Metadata } from "next";
import { Header } from "@/components";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel Parser",
  description: "웅진씽크빅 학습 자료 데이터 엑셀을 파싱하기 위한 데모입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased pt-16">
        <Header />
        {children}
      </body>
    </html>
  );
}
