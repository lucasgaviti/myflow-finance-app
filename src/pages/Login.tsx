import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle, Mail, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { passwordRules } from '../lib/authFeedback';
import type { AuthResult } from '../lib/authFeedback';
import logo from '../assets/logo.png';
import '../styles/auth.css';

type Mode = 'login' | 'register' | 'recover' | 'confirm';
const cooldownKey = `myflow-auth-wait:${import.meta.env.VITE_SUPABASE_URL}`;
function readDeadline() { try { return Number(sessionStorage.getItem(cooldownKey)) || 0; } catch { return 0; } }
function writeDeadline(value: number) { try { sessionStorage.setItem(cooldownKey, String(value)); } catch { /* storage unavailable */ } }
function PasswordField({ label, value, onChange, autoComplete, disabled }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string; disabled: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="mf-auth-field">{label}<span className="mf-auth-password"><input type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} required disabled={disabled} placeholder="••••••••" /><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(v => !v)} disabled={disabled}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>;
}
export default function Login({ recovery = false }: { recovery?: boolean }) {
  const { user, isAuthLoading, isRecovering, signIn, signUp, resendConfirmation, requestPasswordReset, resetPassword } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>(() => (location.state as { recover?: boolean } | null)?.recover ? 'recover' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [deadline, setDeadline] = useState(readDeadline);
  const [loginDeadline, setLoginDeadline] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [dark, setDark] = useState(() => document.body.classList.contains('dark'));
  const wait = Math.max(0, Math.ceil((deadline - now) / 1000));
  const loginWait = Math.max(0, Math.ceil((loginDeadline - now) / 1000));
  const rules = passwordRules(password);
  const newPassword = recovery || mode === 'register';
  const passwordValid = rules.every(rule => rule.valid);
  const [loginNeedsConfirmation, setLoginNeedsConfirmation] = useState(false);
  const candidate = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const redirectTo = candidate && ['/dashboard','/monthly-plan','/transactions','/goals'].includes(candidate) ? candidate : '/dashboard';
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  function startWait(seconds = 60) { const next = Math.max(readDeadline(), Date.now() + seconds * 1000); writeDeadline(next); setDeadline(next); setNow(Date.now()); }
  function switchMode(next: Mode) { if (lock.current) return; setMode(next); setPassword(''); setConfirmation(''); setError(''); setNotice(''); setLoginNeedsConfirmation(false); }
  function toggleTheme() { const next = !dark; document.body.classList.toggle('dark', next); try { localStorage.setItem('myflow-theme', next ? 'dark' : 'light'); } catch { /* optional */ } setDark(next); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || (!recovery && (mode === 'login' ? loginWait > 0 : wait > 0))) return;
    if (newPassword && (!passwordValid || password !== confirmation)) { setError('Confira os requisitos e a confirmação da senha.'); return; }
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      let result: AuthResult;
      const address = email.trim();
      if (recovery) result = await resetPassword(password);
      else if (mode === 'register') result = await signUp(address, password);
      else if (mode === 'recover') result = await requestPasswordReset(address);
      else if (mode === 'confirm') result = await resendConfirmation(address);
      else result = await signIn(address, password);
      if (result.retryAfter && !recovery) { if (mode === 'login') { setLoginDeadline(Date.now() + result.retryAfter * 1000); setNow(Date.now()); } else startWait(result.retryAfter); }
      if (result.error) { setError(result.error); setLoginNeedsConfirmation(result.code === 'email_not_confirmed'); return; }
      if (recovery) { setResetDone(true); setPassword(''); setConfirmation(''); }
      else if (mode === 'register' && result.confirmationRequired) { setMode('confirm'); setPassword(''); setConfirmation(''); startWait(); setNotice('Se o endereço estiver apto para cadastro, você receberá um link de confirmação. Confira também o spam.'); }
      else if (mode === 'recover') { startWait(); setNotice('Se houver uma conta para este e-mail, você receberá um link de recuperação. Confira também o spam.'); }
      else if (mode === 'confirm') { startWait(); setNotice('Se a confirmação estiver pendente, um novo link será enviado. Confira sua caixa de entrada e o spam.'); }
    } catch { setError('Não foi possível concluir a solicitação. Tente novamente mais tarde.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (isAuthLoading) return <div className="auth-page"><div className="auth-card"><div className="auth-loading" role="status">Carregando…</div></div></div>;
  if (!recovery && isRecovering) return <Navigate to="/reset-password" replace/>;
  if (!recovery && user) return <Navigate to={redirectTo} replace/>;
  const invalidRecovery = recovery && !isRecovering && !resetDone;
  const heading = resetDone ? 'Senha atualizada' : invalidRecovery ? 'Link indisponível' : recovery ? 'Defina sua nova senha' : mode === 'register' ? 'Crie sua conta' : mode === 'recover' ? 'Recuperar senha' : mode === 'confirm' ? 'Confirme seu e-mail' : 'Bem-vindo de volta';
  const description = resetDone ? 'Sua senha foi alterada. Você pode continuar para sua conta.' : invalidRecovery ? 'O link pode estar expirado ou já ter sido utilizado. Solicite um novo link de recuperação.' : recovery ? 'Escolha uma senha forte e confirme abaixo.' : mode === 'register' ? 'Comece a organizar suas finanças em um só lugar.' : mode === 'recover' ? 'Enviaremos instruções para redefinir sua senha.' : mode === 'confirm' ? 'Abra o link enviado para ativar sua conta.' : 'Acesse seu controle financeiro pessoal.';
  const blocked = busy || (!recovery && (mode === 'login' ? loginWait > 0 : wait > 0)) || (newPassword && (!passwordValid || password !== confirmation));
  return <main className="auth-page mf-auth-page"><section className="auth-card mf-auth-card" aria-labelledby="auth-title">
    <div className="mf-auth-brand"><div className="auth-logo"><img src={logo} alt="" width="44" height="44"/><div><strong>MyFlow</strong><span>Controle financeiro inteligente</span></div></div><button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={dark?'Ativar tema claro':'Ativar tema escuro'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button></div>
    <header className="auth-header"><h1 id="auth-title">{heading}</h1><p>{description}</p></header>
    {resetDone ? <Link className="primary-btn" to="/dashboard">Continuar para minha conta</Link> : invalidRecovery ? <Link className="secondary-btn" to="/login" state={{ recover: true }}>Voltar ao acesso</Link> : <form className="auth-form mf-auth-form" onSubmit={submit}>
      {!recovery && <label className="mf-auth-field">E-mail<input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required autoComplete="email" placeholder="seu@email.com" disabled={busy}/></label>}
      {(recovery || mode === 'login' || mode === 'register') && <PasswordField key={mode+'-password'} label={recovery?'Nova senha':'Senha'} value={password} onChange={setPassword} autoComplete={newPassword?'new-password':'current-password'} disabled={busy}/>}
      {newPassword && <><PasswordField key="confirmation" label="Confirmar senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" disabled={busy}/><div className="password-rules" aria-label="Requisitos de senha">{rules.map(rule => <div key={rule.label} className={`password-rule ${rule.valid?'valid':'invalid'}`}><span aria-hidden="true">{rule.valid?'✓':'•'}</span>{rule.label}</div>)}</div>{confirmation && confirmation !== password && <p className="mf-auth-mismatch">As senhas não coincidem.</p>}</>}
      {!recovery && mode === 'login' && <button className="auth-switch mf-auth-forgot" type="button" disabled={busy} onClick={() => switchMode('recover')}>Esqueci minha senha</button>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {notice && <div className="mf-auth-notice" role="status"><Mail size={18}/><span>{notice}</span></div>}
      {!recovery && (mode === 'login' ? loginWait > 0 : wait > 0) && <p className="mf-auth-wait" role="status" aria-live="off">Nova solicitação disponível em {mode === 'login' ? loginWait : wait}s.</p>}
      <button className="primary-btn auth-submit" type="submit" disabled={blocked}>{busy ? <><LoaderCircle className="mf-auth-spinner" size={17}/> Processando…</> : recovery ? 'Salvar nova senha' : mode === 'register' ? 'Criar conta' : mode === 'recover' ? 'Enviar link de recuperação' : mode === 'confirm' ? 'Reenviar confirmação' : 'Entrar na conta'}</button>
      {!recovery && mode === 'login' && loginNeedsConfirmation && <button type="button" className="auth-switch" onClick={() => switchMode('confirm')} disabled={busy}>Reenviar confirmação de e-mail</button>}
    </form>}
    {!recovery && <div className="mf-auth-links">{mode === 'login' ? <><button type="button" className="auth-switch" onClick={() => switchMode('register')} disabled={busy}>Ainda não tenho conta</button><button type="button" className="auth-switch" onClick={() => switchMode('confirm')} disabled={busy}>Reenviar confirmação</button></> : <button type="button" className="auth-switch" onClick={() => switchMode('login')} disabled={busy}><ArrowLeft size={15}/> Voltar para o login</button>}</div>}
    <footer className="mf-auth-footer">{resetDone?<Check size={15}/>:<ShieldCheck size={15}/>}<span>{resetDone?'Alteração concluída':'Acesso à sua conta pessoal'}</span></footer>
  </section></main>;
}
