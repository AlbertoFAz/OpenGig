import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} OpenGig</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            Política de privacidad
          </Link>
          <Link href="/legal" className="hover:underline">
            Aviso legal
          </Link>
        </div>
      </div>
    </footer>
  );
}
