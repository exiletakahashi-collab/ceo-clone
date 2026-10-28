import "./globals.css";

export const metadata = {
  title: "SALES CIRCLE｜営業のつながりを、次の可能性へ",
  description: "営業相談、協業、ストック商材の情報共有ができるコミュニティ。",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
