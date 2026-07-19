import { Coffee, Camera, Play, type LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
};

const FEATURES: Feature[] = [
  {
    icon: Coffee,
    title: "Walk at your own pace",
    description: "Pause, wander, grab a coffee. The tour waits for you.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Camera,
    title: "Insider spots, not tourist traps",
    description:
      "Nine stops picked for the best photos and the best stories, not the biggest crowds.",
    color: "bg-accent-1/15 text-accent-1",
  },
  {
    icon: Play,
    title: "Just press play",
    description:
      "Works right in your phone's browser. No app, no download, no account.",
    color: "bg-accent-2/10 text-accent-2",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {FEATURES.map(({ icon: Icon, title, description, color }) => (
          <div
            key={title}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${color}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-bold leading-snug text-card-foreground">
              {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
