import React from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, GraduationCap, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PublicHome() {
  return (
    <main className="public-home">
      <header className="public-header">
        <Link className="brand" to="/">
          <span className="brand-mark"><GraduationCap size={23} strokeWidth={2} /></span>
          <span><strong>Vértice</strong><small>PAINEL ESCOLAR</small></span>
        </Link>
        <nav className="public-nav"><Link className="public-login-link" to="/login">Entrar</Link><Link className="button button-dark button-small" to="/registro">Criar conta <ArrowRight size={15} /></Link></nav>
      </header>
      <section className="public-hero">
        <div className="hero-copy">
          <p className="eyebrow">ACOMPANHAMENTO ESCOLAR</p>
          <h1>Aprendizagem em foco.<br /><span>Progresso à vista.</span></h1>
          <p className="hero-description">Um espaço claro para acompanhar resultados, consultar registros e manter cada etapa do percurso escolar organizada.</p>
          <div className="hero-actions"><Link className="button button-dark" to="/registro">Começar agora <ArrowRight size={16} /></Link><Link className="hero-secondary" to="/login">Já tenho uma conta <ArrowRight size={15} /></Link></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-arch">
            <div className="hero-sheet sheet-back" />
            <div className="hero-sheet sheet-front"><div className="sheet-heading"><span /><i /><i /></div><div className="sheet-title-line" /><div className="sheet-subtitle-line" /><div className="sheet-chart"><span /><span /><span /><span /><span /><span /></div><div className="sheet-row"><i /><b /><i /></div><div className="sheet-row"><i /><b /><i /></div><div className="sheet-row"><i /><b /><i /></div></div>
            <div className="hero-sticker"><GraduationCap size={27} /></div><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          </div>
          <div className="hero-caption"><span className="status-dot" /> SEU ESPAÇO DE ACOMPANHAMENTO</div>
        </div>
      </section>
      <footer className="public-footer"><span>Vértice <i>·</i> Registro Escolar</span><span>Uma visão mais próxima do aprendizado.</span></footer>
    </main>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Preencha o e-mail e a senha para continuar.");
    if (!emailPattern.test(email.trim())) return setError("Informe um endereço de e-mail válido.");

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError("E-mail ou senha inválidos. Confira seus dados e tente novamente.");
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Não foi possível conectar ao serviço de autenticação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage eyebrow="BEM-VINDO DE VOLTA" title="Entre na sua conta" description="Acesse seu espaço de acompanhamento escolar.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field"><span>E-mail</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required /></span></label>
        <label className="auth-field"><span>Senha</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" required /></span></label>
        {error ? <Feedback kind="error">{error}</Feedback> : null}
        <button className="button button-dark auth-submit" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spinner" size={17} /> Entrando...</> : <>Entrar <ArrowRight size={16} /></>}</button>
      </form>
      <p className="auth-switch">Ainda não tem uma conta? <Link to="/registro">Criar cadastro</Link></p>
    </AuthPage>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback(null);
    if (!name.trim() || !email.trim() || !password || !confirmation) return setFeedback({ kind: "error", text: "Preencha todos os campos para criar sua conta." });
    if (!emailPattern.test(email.trim())) return setFeedback({ kind: "error", text: "Informe um endereço de e-mail válido." });
    if (password.length < 8) return setFeedback({ kind: "error", text: "A senha deve conter pelo menos 8 caracteres." });
    if (password !== confirmation) return setFeedback({ kind: "error", text: "A confirmação precisa ser igual à senha informada." });

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { nome: name.trim() } },
      });
      if (error) {
        setFeedback({ kind: "error", text: error.message || "Não foi possível concluir o cadastro. Tente novamente." });
        return;
      }
      if (data.session) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setFeedback({ kind: "success", text: "Cadastro realizado. Confirme seu endereço de e-mail antes de entrar." });
    } catch {
      setFeedback({ kind: "error", text: "Não foi possível conectar ao serviço de cadastro. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage eyebrow="NOVO POR AQUI?" title="Crie sua conta" description="Cadastre-se para acessar o acompanhamento escolar.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field"><span>Nome completo</span><span className="auth-input-wrap"><UserRound size={17} /><input type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome completo" required /></span></label>
        <label className="auth-field"><span>E-mail</span><span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required /></span></label>
        <label className="auth-field"><span>Senha <small>mínimo de 8 caracteres</small></span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Crie uma senha" minLength={8} required /></span></label>
        <label className="auth-field"><span>Confirme a senha</span><span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repita sua senha" required /></span></label>
        {feedback ? <Feedback kind={feedback.kind}>{feedback.text}</Feedback> : null}
        <button className="button button-dark auth-submit" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spinner" size={17} /> Criando conta...</> : <>Criar conta <ArrowRight size={16} /></>}</button>
      </form>
      <p className="auth-switch">Já tem uma conta? <Link to="/login">Entrar</Link></p>
    </AuthPage>
  );
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const fullName = user.user_metadata?.nome || user.user_metadata?.full_name || "Nome não informado";

  async function handleSignOut() {
    setLoading(true);
    try {
      const { error: signOutError } = await signOut();
      if (signOutError) {
        setError("Não foi possível encerrar a sessão. Tente novamente.");
        return;
      }
      navigate("/login", { replace: true });
    } catch {
      setError("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="profile-layout">
      <div className="profile-avatar"><UserRound size={27} /></div>
      <div className="profile-information">
        <div className="profile-item"><span>NOME COMPLETO</span><strong>{fullName}</strong></div>
        <div className="profile-item"><span>E-MAIL</span><strong>{user.email || "—"}</strong></div>
        <div className="profile-item"><span>IDENTIFICADOR DO USUÁRIO</span><strong className="profile-id">{user.id}</strong></div>
        {error ? <Feedback kind="error">{error}</Feedback> : null}
        <button className="button button-outline profile-logout" type="button" onClick={handleSignOut} disabled={loading}>{loading ? <><LoaderCircle className="spinner" size={16} /> Encerrando sessão...</> : <>Encerrar sessão <ArrowRight size={16} /></>}</button>
      </div>
    </section>
  );
}

export function NotFoundPage() {
  return <main className="not-found-page"><Link className="brand" to="/"><span className="brand-mark"><GraduationCap size={23} /></span><span><strong>Vértice</strong><small>PAINEL ESCOLAR</small></span></Link><div className="not-found-content"><p className="eyebrow">ERRO 404</p><h1>Esta página não foi encontrada.</h1><p>O endereço pode ter mudado ou não existe.</p><Link className="button button-dark" to="/">Voltar ao início <ArrowRight size={16} /></Link></div></main>;
}

function AuthPage({ eyebrow, title, description, children }) {
  return (
    <main className="auth-page">
      <div className="auth-side">
        <Link className="brand" to="/"><span className="brand-mark"><GraduationCap size={23} /></span><span><strong>Vértice</strong><small>PAINEL ESCOLAR</small></span></Link>
        <div className="auth-side-copy"><p className="eyebrow">APRENDER É UM PERCURSO</p><h2>Um passo de cada vez.<br /><span>Com clareza.</span></h2><p>Acompanhe resultados e mantenha o foco no que importa: o progresso de cada estudante.</p></div>
        <div className="auth-side-foot"><span className="status-dot" /> ESPAÇO DE ACOMPANHAMENTO ESCOLAR</div>
      </div>
      <section className="auth-main"><div className="auth-card"><Link className="auth-back" to="/"><span>←</span> Início</Link><div className="auth-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children}</div><p className="auth-legal">Registro Escolar <span>·</span> Acesso seguro à sua conta</p></section>
    </main>
  );
}

function Feedback({ kind, children }) {
  return <div className={`auth-feedback ${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</div>;
}