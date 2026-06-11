import { useState, useEffect } from 'react';
import { LayoutGrid, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Status = 'idle' | 'sending' | 'sent';

export default function Auth() {
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setStatus('sending');
    const result = await signInWithOtp(email.trim());
    if (result.error) {
      setError(result.error);
      setStatus('idle');
    } else {
      setStatus('sent');
      setResendTimer(60);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setStatus('sending');
    const result = await signInWithOtp(email.trim());
    if (result.error) {
      setError(result.error);
      setStatus('idle');
    } else {
      setResendTimer(60);
      setStatus('sent');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#161920] border border-slate-200 dark:border-[#1E222A] rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-600 dark:bg-indigo-600 rounded-xl text-white shadow-md">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                FinanSpread<span className="text-blue-500 dark:text-indigo-400 font-light italic">OS</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Controle financeiro pessoal</p>
            </div>
          </div>

          {status !== 'sent' ? (
            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-[#1E222A] rounded-xl bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none dark:bg-[#0F1115]"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
              >
                {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Enviar link de acesso
              </button>

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Enviaremos um link seguro para o seu email.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                Link enviado para <span className="font-semibold">{email}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Clique no link no email para entrar. Você será conectado automaticamente ao voltar para o app.
              </p>

              {error && (
                <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 rounded-lg text-center">
                  {error}
                </p>
              )}

              <button
                onClick={() => { setStatus('idle'); setEmail(''); setError(''); }}
                className="w-full text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                Usar outro email
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Não recebeu?{' '}
                <button
                  onClick={handleResend}
                  disabled={resendTimer > 0}
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar link'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
