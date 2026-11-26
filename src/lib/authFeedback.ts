export type AuthResult = { error: string | null; code?: string; retryAfter?: number; confirmationRequired?: boolean };

type AuthIssue = { message?: string; code?: string; status?: number };

export function authFeedback(issue: unknown): AuthResult {
  if (!issue) return { error: null };
  const { message = '', code, status } = issue as AuthIssue;
  const seconds = message.match(/after\s+(\d+)\s*seconds?/i);
  if (seconds || status === 429 || code?.startsWith('over_')) {
    const retryAfter = seconds ? Math.max(1, Number(seconds[1])) : 60;
    return { error: seconds ? 'Por segurança, aguarde o intervalo indicado antes de tentar novamente.' : 'Limite de solicitações atingido. Aguarde antes de tentar novamente; o limite de envio de e-mails pode durar até uma hora.', code, retryAfter };
  }
  const errors: Record<string, string> = {
    invalid_credentials: 'E-mail ou senha incorretos.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar na conta.',
    email_address_not_authorized: 'O serviço de e-mail ainda não permite enviar mensagens para este endereço. Entre em contato com o suporte.',
    signup_disabled: 'O cadastro está temporariamente indisponível.',
    user_already_exists: 'Não foi possível criar a conta. Se já possui cadastro, entre ou recupere a senha.',
    email_exists: 'Não foi possível criar a conta. Se já possui cadastro, entre ou recupere a senha.',
    weak_password: 'Escolha uma senha mais forte.',
    same_password: 'Escolha uma senha diferente da anterior.',
    otp_expired: 'O link expirou ou já foi utilizado. Solicite um novo.',
    session_expired: 'Sua sessão expirou. Solicite um novo link.',
    session_not_found: 'Sua sessão não está disponível. Solicite um novo link.',
    reauthentication_needed: 'É necessário autenticar-se novamente para alterar a senha.',
    validation_failed: 'Confira os dados informados e tente novamente.',
    email_address_invalid: 'Informe um endereço de e-mail válido.',
    unexpected_failure: 'O serviço de autenticação está indisponível. Tente novamente mais tarde.',
  };
  if (code && errors[code]) return { error: errors[code], code };
  if (/invalid login credentials/i.test(message)) return { error: errors.invalid_credentials, code: 'invalid_credentials' };
  if (/email not confirmed/i.test(message)) return { error: errors.email_not_confirmed, code: 'email_not_confirmed' };
  if (/fetch|network|failed to connect/i.test(message)) return { error: 'Não foi possível conectar. Confira sua internet e tente novamente.', code };
  if (/sending.*email|smtp/i.test(message)) return { error: 'Não foi possível enviar o e-mail. Verifique a configuração de envio ou tente mais tarde.', code };
  return { error: 'Não foi possível concluir a solicitação. Confira os dados ou tente novamente mais tarde.', code };
}

export const passwordRules = (password: string) => [
  { label: 'Pelo menos 8 caracteres', valid: password.length >= 8 },
  { label: 'Uma letra maiúscula', valid: /[A-Z]/.test(password) },
  { label: 'Uma letra minúscula', valid: /[a-z]/.test(password) },
  { label: 'Um número', valid: /\d/.test(password) },
  { label: 'Um caractere especial', valid: /[^A-Za-z0-9\s]/.test(password) },
];
