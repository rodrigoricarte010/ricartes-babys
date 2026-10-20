"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cloud, Mail, Lock, ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { isCloudConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { resetDataSource } from "@/lib/db";
import { useStore } from "@/lib/store";

export function EntrarPage() {
  const router = useRouter();
  const toast = useToast();
  const { reload } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentMagic, setSentMagic] = useState(false);

  async function signInWithPassword() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(traduzErro(error.message));
      return;
    }
    resetDataSource();
    await reload();
    router.push("/painel");
  }

  async function sendMagicLink() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // O link volta com um `?code=` que só a rota /auth/callback sabe trocar
      // por uma sessão. Apontar para /entrar fazia o código ser ignorado e o
      // usuário voltava ao formulário sem estar logado.
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      toast.error(traduzErro(error.message));
      return;
    }
    setSentMagic(true);
    toast.success("Link mágico enviado. Confira seu e-mail.");
  }

  if (!isCloudConfigured) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <Card>
          <CardHeader
            title="Nuvem não configurada"
            subtitle="Por enquanto o app roda em modo local — e isso já funciona muito bem"
            icon={<Cloud className="size-4.5" />}
          />
          <CardBody className="space-y-4">
            <p className="text-sm leading-relaxed text-fg-muted">
              Para criar contas e sincronizar entre o seu celular, o da mãe e o dos avós, é preciso
              conectar um projeto Supabase. Leva uns cinco minutos e é grátis.
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg-muted">
              <li>Crie o projeto em supabase.com</li>
              <li>Rode <code className="rounded bg-bg-muted px-1">supabase/schema.sql</code></li>
              <li>Preencha o <code className="rounded bg-bg-muted px-1">.env.local</code></li>
            </ol>
            <div className="flex gap-2">
              <Link href="/configuracoes" className="flex-1">
                <Button variant="outline" block>
                  Ver instruções
                </Button>
              </Link>
              <Link href="/painel" className="flex-1">
                <Button block>
                  Usar em modo local
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Card>
        <CardHeader
          title="Entrar na conta da família"
          subtitle="Seus registros sincronizam em todos os aparelhos conectados"
          icon={<Cloud className="size-4.5" />}
        />
        <CardBody className="space-y-4">
          <Field label="E-mail">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@familia.com"
            />
          </Field>

          {!sentMagic && (
            <Field label="Senha">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          )}

          <div className="space-y-2">
            {!sentMagic ? (
              <>
                <Button block onClick={signInWithPassword} disabled={!email || !password} loading={busy}>
                  <Lock className="size-4" aria-hidden />
                  Entrar com senha
                </Button>
                <Button block variant="outline" onClick={sendMagicLink} disabled={!email} loading={busy}>
                  <Mail className="size-4" aria-hidden />
                  Enviar link mágico
                </Button>
              </>
            ) : (
              <p className="rounded-xl bg-sage-50 p-3 text-sm text-sage-800 dark:bg-sage-950/40 dark:text-sage-200">
                Enviamos um link para <strong>{email}</strong>. Toque nele neste aparelho para entrar.
              </p>
            )}
          </div>

          {/* O acesso agora é estrito: sem sessão, o middleware manda de volta
              para cá. O modo local segue existindo só quando o app roda sem
              as variáveis do Supabase (desenvolvimento/offline). */}
        </CardBody>
      </Card>
    </div>
  );
}

/** Erros do Supabase chegam em inglês; traduzimos os mais comuns. */
function traduzErro(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "Email not confirmed": "Confirme seu e-mail antes de entrar.",
    "Invalid email or password": "E-mail ou senha incorretos.",
    "rate limit exceeded": "Muitas tentativas. Aguarde um pouco e tente de novo.",
  };
  return map[message] ?? `Não foi possível entrar: ${message}`;
}
