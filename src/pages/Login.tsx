import {
  useMemo,
  useState,
} from 'react';

import {
  Navigate,
} from 'react-router-dom';

import {
  Wallet,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const {
    user,
    signIn,
    signUp,
    isAuthLoading,
  } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [isRegister, setIsRegister] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState('');

  const passwordRules =
    useMemo(
      () => [
        {
          label: 'Mínimo de 8 caracteres',
          isValid: password.length >= 8,
        },
        {
          label: 'Uma letra maiúscula',
          isValid: /[A-Z]/.test(password),
        },
        {
          label: 'Uma letra minúscula',
          isValid: /[a-z]/.test(password),
        },
        {
          label: 'Um número',
          isValid: /\d/.test(password),
        },
        {
          label: 'Um caractere especial',
          isValid:
            /[^A-Za-z0-9]/.test(password),
        },
      ],
      [password],
    );

  const isPasswordValid =
    passwordRules.every(
      (rule) => rule.isValid,
    );

  if (isAuthLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-loading">
            Carregando...
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (!email || !password) {
      setError(
        'Informe e-mail e senha para continuar.',
      );
      return;
    }

    if (
      isRegister &&
      !isPasswordValid
    ) {
      setError(
        'A senha ainda não atende aos requisitos mínimos.',
      );
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = isRegister
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-background" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Wallet size={28} />
          </div>

          <div>
            <strong>
              MyFlow Finance
            </strong>

            <span>
              Controle financeiro inteligente
            </span>
          </div>
        </div>

        <div className="auth-header">
          <h1>
            {isRegister
              ? 'Criar conta'
              : 'Entrar na conta'}
          </h1>

          <p>
            {isRegister
              ? 'Cadastre-se para começar a controlar suas finanças.'
              : 'Acesse seu dashboard financeiro pessoal.'}
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            E-mail
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              autoComplete="email"
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              autoComplete={
                isRegister
                  ? 'new-password'
                  : 'current-password'
              }
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
            />
          </label>

          {isRegister && (
            <div className="password-rules">
              {passwordRules.map(
                (rule) => (
                  <div
                    key={rule.label}
                    className={`password-rule ${
                      rule.isValid
                        ? 'valid'
                        : 'invalid'
                    }`}
                  >
                    <span>
                      {rule.isValid
                        ? '✓'
                        : '•'}
                    </span>

                    {rule.label}
                  </div>
                ),
              )}
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-btn auth-submit"
            disabled={
              isSubmitting ||
              (isRegister &&
                !isPasswordValid)
            }
          >
            {isSubmitting
              ? 'Processando...'
              : isRegister
                ? 'Criar conta'
                : 'Entrar'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setIsRegister(
              (prev) => !prev,
            );
            setError('');
            setPassword('');
          }}
        >
          {isRegister
            ? 'Já tenho uma conta'
            : 'Ainda não tenho conta'}
        </button>
      </div>
    </div>
  );
}