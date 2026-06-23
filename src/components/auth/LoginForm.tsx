"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm() {
  const router = useRouter();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function onGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">{t.auth.loginTitle}</CardTitle>
        <CardDescription>{t.auth.loginDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.auth.email}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t.auth.password}</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:underline"
                    >
                      {t.auth.forgotPassword}
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.common.loading : t.auth.login}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={onGoogleLogin}>
              {t.auth.continueWithGoogle}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t.auth.dontHaveAccount}{" "}
              <Link href="/register" className="font-medium hover:underline">
                {t.auth.register}
              </Link>
            </p>
          </form>
        </Form>
      </CardContent>
    </>
  );
}
