"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";

import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { REGISTERABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/schemas/profile";
import { createClient } from "@/lib/supabase/client";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: "USER" },
  });

  async function onSubmit(values: RegisterInput) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role: values.role },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  async function onGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (sent) {
    return (
      <div className="grid gap-2 text-center">
        <p className="font-medium">{es.auth.checkEmail}</p>
        <p className="text-sm text-muted-foreground">{es.auth.verifyEmail}</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {/* Selector de rol */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cómo usarás OpenGig? *</FormLabel>
              <FormControl>
                <div className="grid gap-2">
                  {REGISTERABLE_ROLES.map((role) => (
                    <label
                      key={role}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        field.value === role
                          ? "border-primary bg-primary/5"
                          : "hover:border-muted-foreground/50"
                      }`}
                    >
                      <input
                        type="radio"
                        value={role}
                        checked={field.value === role}
                        onChange={() => field.onChange(role)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                        <p className="text-muted-foreground text-xs">{ROLE_DESCRIPTIONS[role]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{es.auth.email}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="tu@email.com" {...field} />
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
              <FormLabel>{es.auth.password}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? es.common.loading : es.auth.register}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={onGoogleLogin}>
          {es.auth.continueWithGoogle}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {es.auth.alreadyHaveAccount}{" "}
          <Link href="/login" className="font-medium hover:underline">
            {es.auth.login}
          </Link>
        </p>
      </form>
    </Form>
  );
}
