import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  BrainCircuit,
  CheckCircle2,
  Eye,
  Lightbulb,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-shield.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduGuard AI – Identify Academic Risk Early" },
      {
        name: "description",
        content:
          "EduGuard AI analyzes attendance, assignments, quizzes and marks to flag at-risk students early and alert faculty so they can step in.",
      },
      { property: "og:title", content: "EduGuard AI – Identify Academic Risk Early" },
      { property: "og:description", content: "Predict early. Intervene quickly. Improve student retention." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BrainCircuit, title: "AI risk prediction", text: "Scores every student 0–100 from attendance, assignments, quizzes, internal and past marks." },
  { icon: Activity, title: "Real-time monitoring", text: "Risk updates the moment a record changes — no waiting for end-of-term results." },
  { icon: BellRing, title: "Automated faculty alerts", text: "Students who cross into high risk trigger an alert to their assigned faculty." },
  { icon: BarChart3, title: "Performance analytics", text: "Department breakdowns, attendance trends and risk distribution at a glance." },
  { icon: Lightbulb, title: "Intervention guidance", text: "Every prediction explains why and suggests concrete next steps." },
  { icon: CheckCircle2, title: "Intervention tracking", text: "Log counseling, remedial classes and mentoring — and see if risk drops." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <span className="font-display text-lg font-bold">EduGuard AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-2 lg:pt-14">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-card">
            <span className="size-1.5 rounded-full bg-sky" /> Student Early Warning System for Academic Retention
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            Identify Academic Risk Early. <span className="text-gradient-primary">Support Every Student.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            EduGuard AI watches the warning signs — falling attendance, missed assignments, slipping quiz
            scores — and tells faculty who needs help before exams are failed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg">
              <Link to="/login">
                Get Started <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["30", "sample students"],
              ["5", "risk signals"],
              ["3", "user roles"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-primary">{n}</div>
                <div className="text-xs text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImg}
            alt="Shield with graduation cap surrounded by student analytics cards"
            width={1280}
            height={1024}
            className="animate-float-soft w-full rounded-3xl"
          />
        </div>
      </section>

      <section className="bg-card/60 py-16 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 md:grid-cols-2">
          <div className="surface p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Eye className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">The problem</h2>
            <p className="mt-2 text-muted-foreground">
              Manual monitoring misses students at risk. Poor attendance, missing assignments and declining
              quiz scores go unnoticed until a student fails an exam — or drops out.
            </p>
          </div>
          <div className="surface p-7">
            <div className="flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
              <TrendingDown className="size-5" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Our solution</h2>
            <p className="mt-2 text-muted-foreground">
              EduGuard continuously analyzes academic data, predicts distress with a transparent risk model,
              explains the reasons, and alerts faculty so they can provide timely support.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything faculty need to act early</h2>
          <p className="mt-3 text-muted-foreground">One place for admins, faculty and students — each with their own view.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="surface animate-fade-up p-6 transition-transform hover:-translate-y-1" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="rounded-3xl bg-gradient-primary px-8 py-12 text-center text-primary-foreground shadow-elevated">
          <h2 className="text-3xl font-bold">Predict Early. Intervene Quickly. Improve Student Retention.</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-85">Explore the demo as an administrator, a faculty member or a student.</p>
          <Button asChild size="lg" variant="secondary" className="mt-7">
            <Link to="/login">
              Open the demo <ArrowRight />
            </Link>
          </Button>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Risk predictions come from a demo model calibrated on sample data and are not scientifically validated.
        </p>
      </section>
    </div>
  );
}
