"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Plus,
  Search,
  MessageSquare,
  Handshake,
  Layers,
  Compass,
  ArrowRight,
  X,
  Send,
  Users,
  BookOpen,
  RefreshCw,
} from "lucide-react";
type Post = {
  id: string;
  author: string;
  category: string;
  title: string;
  body: string;
  createdAt: number;
};
type Reply = { id: string; postId: string; author: string; body: string; createdAt: number };
const cats = ["すべて", "営業相談", "協業・紹介", "商材情報", "高橋に相談", "交流・雑談"];
const samples: Post[] = [
  {
    id: "sample-1",
    author: "投稿例",
    category: "営業相談",
    title: "初回の紹介で、何をヒアリングしていますか？",
    body: "サービスに興味を持っていただいた後、提供会社へつなぐ前に確認したい項目を相談する投稿例です。皆さんの工夫を持ち寄りましょう。",
    createdAt: 0,
  },
  {
    id: "sample-2",
    author: "投稿例",
    category: "協業・紹介",
    title: "得意な業界を持ち寄って、協業しませんか。",
    body: "活動エリア、得意な業界、探しているパートナーを記載して、仕事のつながりをつくる投稿例です。",
    createdAt: 0,
  },
  {
    id: "sample-3",
    author: "投稿例",
    category: "商材情報",
    title: "AIO・AIサービスの案件情報をここに集約",
    body: "対象顧客、紹介条件、報酬の継続条件、提供会社の対応範囲をまとめて共有します。現在は表示例で、実際の募集案件ではありません。",
    createdAt: 0,
  },
];
export default function Board({ signedIn, userName }: { signedIn: boolean; userName?: string }) {
  const [tab, setTab] = useState("コミュニティ");
  const [cat, setCat] = useState("すべて");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/board");
      const d = (await r.json()) as { error: string; posts: Post[]; replies: Reply[] };
      if (!r.ok) throw Error(d.error);
      setPosts(d.posts);
      setReplies(d.replies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (signedIn) void refresh();
    else setLoading(false);
  }, [signedIn]);
  function compose(category?: string) {
    if (category) setCat(category);
    setModal(true);
    setNotice("");
  }
  async function submit(e: React.FormEvent<HTMLFormElement>, postId?: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setSaving(true);
    setNotice("");
    try {
      const r = await fetch("/api/board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, postId }),
      });
      const d = (await r.json()) as { error: string; posts: Post[]; replies: Reply[] };
      if (!r.ok) throw Error(d.error);
      form.reset();
      setModal(false);
      setNotice(postId ? "返信しました。" : "投稿しました。");
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModal(false);
        setSelected(null);
      }
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const list = (posts.length ? posts : samples).filter(
    (p) =>
      (cat === "すべて" || p.category === cat) && `${p.title}${p.body}${p.author}`.includes(query),
  );
  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brandmark">
            s<span>c</span>
          </span>
          <div>
            SALES CIRCLE<small>PARTNER COMMUNITY</small>
          </div>
        </a>
        <div className="workspace">
          MEMBER WORKSPACE<span>一人の営業を、チームの力に。</span>
        </div>
        <nav>
          {[
            ["コミュニティ", MessageSquare],
            ["商材ライブラリ", Layers],
            ["高橋アドバイザリー", Compass],
            ["ご利用ガイド", BookOpen],
          ].map(([name, Icon]: any) => (
            <button
              key={name}
              className={tab === name ? "nav active" : "nav"}
              onClick={() => {
                setTab(name);
                setCat("すべて");
              }}
            >
              <Icon size={19} />
              {name}
              {tab === name && <span className="dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebottom">
          <div className="circleicon">
            <Users size={22} />
          </div>
          <strong>つながりから、可能性を。</strong>
          <p>
            相談し、知恵を持ち寄り、
            <br />
            次の仕事を一緒につくろう。
          </p>
          <span className="status">● PRIVATE COMMUNITY</span>
        </div>
      </aside>
      <div className="main">
        <header>
          <div>
            <span className="breadcrumb">WORKSPACE</span>
            <span className="slash">/</span>
            {tab}
          </div>
          <div className="member">
            <span className="live" /> メンバーラウンジ <span className="avatar">SC</span>
            {signedIn ? (
              <form action="/api/logout" method="post">
                <button className="logout">ログアウト</button>
              </form>
            ) : (
              <a className="logout" href="/login">
                ログイン
              </a>
            )}
          </div>
        </header>
        <main>
          <section className="hero">
            <div className="eyebrow">CONNECT. SHARE. GROW.</div>
            <h1>
              そのつながりが、
              <br />
              次の可能性になる。
            </h1>
            <p>
              営業の悩みも、新しい商材も、次の協業も。
              <br />
              仲間と情報を持ち寄り、継続するビジネスを育てよう。
            </p>
            <button className="cream" onClick={() => compose()}>
              仲間に相談してみる <ArrowUpRight size={18} />
            </button>
            <div className="orbit o1" />
            <div className="orbit o2" />
            <div className="orbit o3" />
            <div className="orbitlabel">
              BETTER
              <br />
              <em>TOGETHER.</em>
              <span>SALES CIRCLE / COMMUNITY</span>
            </div>
          </section>
          <div className="quick">
            <button
              onClick={() => {
                setTab("コミュニティ");
                setCat("営業相談");
              }}
            >
              <MessageSquare />
              <span>
                <strong>悩みをシェアする</strong>
                <small>仲間の経験が、次の一手に。</small>
              </span>
              <ArrowUpRight />
            </button>
            <button onClick={() => setTab("商材ライブラリ")}>
              <Layers />
              <span>
                <strong>ストック商材を知る</strong>
                <small>AIO・AIサービスの情報を集約。</small>
              </span>
              <ArrowUpRight />
            </button>
            <button
              onClick={() => {
                setTab("コミュニティ");
                setCat("協業・紹介");
              }}
            >
              <Handshake />
              <span>
                <strong>協業のきっかけをつくる</strong>
                <small>得意分野を持ち寄って、つながる。</small>
              </span>
              <ArrowUpRight />
            </button>
          </div>
          <div className="content">
            <section className="feed">
              {tab === "コミュニティ" ? (
                <>
                  <div className="sectiontitle">
                    <div>
                      <span className="eyebrow">COMMUNITY BOARD</span>
                      <h2>みんなの掲示板</h2>
                    </div>
                    <button className="primary" onClick={() => compose()}>
                      <Plus size={17} />
                      投稿する
                    </button>
                  </div>
                  <div className="search">
                    <Search size={18} />
                    <input
                      aria-label="投稿を検索"
                      placeholder="キーワードで投稿を探す"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button aria-label="再読み込み" onClick={refresh}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <div className="tabs">
                    {cats.map((c) => (
                      <button
                        className={cat === c ? "chosen" : ""}
                        key={c}
                        onClick={() => setCat(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {error && <p className="alert">{error}</p>}
                  {!signedIn && (
                    <p className="alert">
                      <a href="/login">
                        ログインして投稿・返信する →
                      </a>
                    </p>
                  )}
                  {notice && !modal && !selected && (
                    <p role="status" className="alert">
                      {notice}
                    </p>
                  )}
                  {loading ? (
                    <p className="empty">読み込み中…</p>
                  ) : (
                    <>
                      {!posts.length && (
                        <p className="samplehint">
                          使い方がわかる投稿例です。最初の投稿をお待ちしています。
                        </p>
                      )}
                      {list.map((p) => (
                        <button
                          className="post"
                          key={p.id}
                          onClick={() => {
                            setSelected(p);
                            setNotice("");
                          }}
                        >
                          <div className="posttop">
                            <span className={"tag tag" + cats.indexOf(p.category)}>
                              {p.category}
                            </span>
                            <span>
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString("ja-JP")
                                : "SAMPLE"}
                            </span>
                          </div>
                          <h3>{p.title}</h3>
                          <p>{p.body}</p>
                          <div className="postfooter">
                            <span>
                              <i>{p.author.slice(0, 1)}</i>
                              {p.author}
                            </span>
                            <span>
                              <MessageSquare size={15} />
                              {replies.filter((r) => r.postId === p.id).length} 件の返信
                              <ArrowRight size={16} />
                            </span>
                          </div>
                        </button>
                      ))}
                      {!list.length && (
                        <p className="empty">
                          該当する投稿はありません。最初の話題を投稿してみましょう。
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : tab === "商材ライブラリ" ? (
                <>
                  <div className="sectiontitle">
                    <div>
                      <span className="eyebrow">OPPORTUNITIES</span>
                      <h2>商材ライブラリ</h2>
                    </div>
                  </div>
                  <p className="intro">
                    トスアップできる商材の条件を、ひとつの場所に。
                    <br />
                    正式な案件は「商材情報」の掲示板で共有します。
                  </p>
                  {["AIO関連サービス", "AIサービス"].map((v, i) => (
                    <div className="product" key={v}>
                      <span className="tag">掲載準備中</span>
                      <h3>{v}</h3>
                      <p>
                        {i
                          ? "業務効率化など、顧客の課題に合わせたAIサービス。"
                          : "AIO領域のサービスに関する紹介案件。"}
                      </p>
                      <dl>
                        <dt>報酬・継続条件</dt>
                        <dd>提供会社の正式条件を確認後に掲載</dd>
                        <dt>紹介後の対応範囲</dt>
                        <dd>案件ごとに明記</dd>
                      </dl>
                    </div>
                  ))}
                  <button
                    className="primary"
                    onClick={() => {
                      setTab("コミュニティ");
                      setCat("商材情報");
                    }}
                  >
                    商材情報の掲示板を見る <ArrowRight size={16} />
                  </button>
                </>
              ) : tab === "高橋アドバイザリー" ? (
                <>
                  <span className="eyebrow">ADVISORY</span>
                  <h2>一人で抱えず、相談しよう。</h2>
                  <p className="intro">
                    高橋がアドバイザリーとして参加する相談スペース。営業の進め方、商材の選び方、協業のアイデアを共有できます。
                  </p>
                  <div className="product">
                    <h3>相談を、具体的な次の一歩に。</h3>
                    <p>
                      ① いまの状況
                      <br />② 困っていること
                      <br />③ 試したこと
                      <br />④ アドバイスがほしいこと
                    </p>
                    <p>
                      回答時間・対応頻度は運営開始時にご案内します。相談は掲示板の参加者に共有されます。
                    </p>
                    <button className="primary" onClick={() => compose("高橋に相談")}>
                      相談を投稿する <ArrowUpRight size={16} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="eyebrow">GETTING STARTED</span>
                  <h2>はじめてのSALES CIRCLE</h2>
                  <div className="product">
                    <h3>01　自己紹介から、つながろう</h3>
                    <p>「交流・雑談」で得意な業界、活動エリア、興味のある商材を紹介しましょう。</p>
                    <h3>02　悩みと経験をシェアしよう</h3>
                    <p>
                      相談には具体的な状況を。返信ではお互いを尊重し、実体験を持ち寄りましょう。
                    </p>
                    <h3>03　案件の条件を確かめよう</h3>
                    <p>
                      報酬額・支払い条件・解約時の扱い・顧客対応の担当を、紹介前に確認してください。
                    </p>
                    <h3>みんなが安心して話せる場所に</h3>
                    <p>
                      顧客の氏名や連絡先、秘密情報は投稿しないでください。無断の勧誘や投稿の外部転載は控えましょう。月20万円の継続報酬は目標であり、成果を保証するものではありません。
                    </p>
                  </div>
                </>
              )}
            </section>
            <aside className="right">
              <div className="advisory">
                <span className="eyebrow">YOUR ADVISOR</span>
                <div className="advisoravatar">高</div>
                <h3>高橋アドバイザリー</h3>
                <p>
                  営業の壁を、
                  <br />
                  一緒に越えていく。
                </p>
                <small>
                  商材の選び方から提案の悩みまで。
                  <br />
                  気になることを相談しよう。
                </small>
                <button
                  onClick={() => {
                    setTab("高橋アドバイザリー");
                  }}
                >
                  相談スペースへ <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="guidelines">
                <span className="eyebrow">OUR CULTURE</span>
                <h3>
                  いい仕事は、
                  <br />
                  いい関係から。
                </h3>
                <p>
                  <span>01</span> 小さな悩みも、言葉にする。
                </p>
                <p>
                  <span>02</span> 得意なことを、持ち寄る。
                </p>
                <p>
                  <span>03</span> 相手への敬意を、忘れない。
                </p>
                <button onClick={() => setTab("ご利用ガイド")}>
                  コミュニティガイド <ArrowRight size={15} />
                </button>
              </div>
            </aside>
          </div>
          <footer>
            SALES CIRCLE <span>つながりを、次の可能性へ。</span>
          </footer>
        </main>
      </div>
      {(modal || selected) && (
        <div
          className="overlay"
          onClick={() => {
            setModal(false);
            setSelected(null);
          }}
        >
          <section
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={modal ? "新しい投稿" : "投稿の詳細"}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="閉じる"
              onClick={() => {
                setModal(false);
                setSelected(null);
              }}
            >
              <X />
            </button>
            {modal ? (
              <>
                <span className="eyebrow">START A CONVERSATION</span>
                <h2>仲間にシェアする</h2>
                {signedIn ? (
                  <form onSubmit={(e) => submit(e)}>
                    <label>
                      表示名
                      <input
                        name="author"
                        maxLength={40}
                        required
                        defaultValue={userName}
                        placeholder="掲示板で使うお名前"
                      />
                    </label>
                    <label>
                      カテゴリ
                      <select name="category" defaultValue={cat === "すべて" ? "営業相談" : cat}>
                        {cats.slice(1).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      タイトル
                      <input
                        name="title"
                        required
                        maxLength={120}
                        placeholder="相談・共有したいことをひとことで"
                      />
                    </label>
                    <label>
                      本文
                      <textarea
                        name="body"
                        required
                        maxLength={5000}
                        rows={6}
                        placeholder="状況や、仲間に聞きたいことを書いてみましょう。"
                      />
                    </label>
                    <small>顧客の個人情報や秘密情報は記載しないでください。</small>
                    <button className="primary" disabled={saving}>
                      {saving ? "保存中…" : "投稿する"}
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <a className="primary" href="/login">
                    ログインして投稿する
                  </a>
                )}
              </>
            ) : (
              selected && (
                <>
                  <span className="tag">{selected.category}</span>
                  <h2>{selected.title}</h2>
                  <small>
                    {selected.author}
                    {!selected.createdAt && " · サンプル投稿"}
                  </small>
                  <p className="bodytext">{selected.body}</p>
                  <h3>返信</h3>
                  {replies
                    .filter((r) => r.postId === selected.id)
                    .map((r) => (
                      <div className="reply" key={r.id}>
                        <strong>{r.author}</strong>
                        <p className="bodytext">{r.body}</p>
                      </div>
                    ))}
                  {selected.createdAt && signedIn ? (
                    <form onSubmit={(e) => submit(e, selected.id)}>
                      <label>
                        表示名
                        <input name="author" required maxLength={40} defaultValue={userName} />
                      </label>
                      <label>
                        返信
                        <textarea name="body" required rows={3} maxLength={5000} />
                      </label>
                      <button className="primary" disabled={saving}>
                        {saving ? "保存中…" : "返信する"}
                        <Send size={16} />
                      </button>
                    </form>
                  ) : (
                    <p className="samplehint">
                      {selected.createdAt
                        ? "ログインすると返信できます。"
                        : "これは表示例です。新しい投稿から会話を始められます。"}
                    </p>
                  )}
                </>
              )
            )}
            {notice && (
              <p className="alert" role="status">
                {notice}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
