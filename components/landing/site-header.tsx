import { GuidoooWordmark } from "@/components/brand/guidooo-logo";

export function SiteHeader() {
  return (
    <header className="w-full">
      <div className="mx-auto flex max-w-5xl items-center px-5 py-5 sm:px-8">
        <a
          href="/"
          aria-label="Guidooo home"
          className="rounded-pill focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <GuidoooWordmark className="text-2xl" />
        </a>
      </div>
    </header>
  );
}
