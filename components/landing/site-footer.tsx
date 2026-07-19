import { GuidoooWordmark } from "@/components/brand/guidooo-logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-8 sm:flex-row sm:justify-between sm:px-8">
        <GuidoooWordmark className="text-xl" />
        <p className="text-xs text-muted-foreground">© 2026 26commerce</p>
      </div>
    </footer>
  );
}
