import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/session";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "ログイン｜SALES CIRCLE" };

export default async function LoginPage() {
  if (await getCurrentMember().catch(() => null)) redirect("/");
  return (
    <div className="loginpage">
      <section className="logincard">
        <a className="brand" href="/">
          <span className="brandmark">
            s<span>c</span>
          </span>
          <div>
            SALES CIRCLE<small>PARTNER COMMUNITY</small>
          </div>
        </a>
        <span className="eyebrow">MEMBER LOGIN</span>
        <h1>おかえりなさい。</h1>
        <p>登録済みのメールアドレスとパスワードでログインしてください。</p>
        <LoginForm />
      </section>
    </div>
  );
}
