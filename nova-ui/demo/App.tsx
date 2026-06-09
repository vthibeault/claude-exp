import { useState, type ReactNode } from "react";
import {
  Bell,
  Copy,
  LogOut,
  Moon,
  MoreHorizontal,
  Pencil,
  Rocket,
  Settings,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Input,
  Kbd,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  Separator,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ToastProvider,
  Tooltip,
  useToast,
} from "../src";

function toggleTheme() {
  const flip = () => {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("nova-theme", dark ? "dark" : "light");
  };
  // Animate the theme swap with the View Transitions API where available.
  if (document.startViewTransition) document.startViewTransition(flip);
  else flip();
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">{children}</CardContent>
      </Card>
    </section>
  );
}

function Showcase() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progress, setProgress] = useState(62);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            <span className="text-sm font-semibold uppercase tracking-widest text-accent">Nova UI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Next-gen components, native platform</h1>
          <p className="mt-2 max-w-xl text-muted">
            React 19, Tailwind v4, OKLCH tokens — with the Popover API, native{" "}
            <code className="rounded bg-surface-2 px-1 text-sm">&lt;dialog&gt;</code>,{" "}
            <code className="rounded bg-surface-2 px-1 text-sm">@starting-style</code> animations and{" "}
            <code className="rounded bg-surface-2 px-1 text-sm">&lt;details name&gt;</code> accordions doing
            the heavy lifting instead of JavaScript.
          </p>
        </div>
        <Tooltip content="Toggle theme (View Transitions)">
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
          </Button>
        </Tooltip>
      </header>

      <Section title="Buttons" description="Variants, sizes, loading state, and asChild composition.">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button loading>Saving…</Button>
        <Button asChild variant="outline">
          <a href="#anchors">
            <Rocket /> As link
          </a>
        </Button>
      </Section>

      <Section title="Badges & avatars" description="Status colors from the OKLCH ramp; avatars with graceful fallback.">
        <Badge>Default</Badge>
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Separator orientation="vertical" className="h-6" />
        <Avatar size="sm" fallback="VT" />
        <Avatar fallback="NU" />
        <Avatar size="lg" src="https://i.pravatar.cc/96?img=13" alt="Demo user" fallback="DU" />
      </Section>

      <Section
        title="Top layer: dialog & sheet"
        description="Native <dialog> — focus trap, inert background and Esc are free. CSS-only enter/exit via @starting-style."
      >
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogHeader>
            <DialogTitle>Delete workspace?</DialogTitle>
            <DialogDescription>
              This permanently removes the workspace and all of its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Field label="Type the workspace name to confirm" required>
            <Input placeholder="acme-production" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDialogOpen(false);
                toast({ title: "Workspace deleted", variant: "danger" });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>

        <Dialog open={sheetOpen} onOpenChange={setSheetOpen} variant="sheet">
          <DialogHeader>
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>Choose what you want to hear about.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {["Comments", "Mentions", "Deploys", "Weekly digest"].map((item) => (
              <div key={item} className="flex items-center justify-between">
                <Label>{item}</Label>
                <Switch defaultChecked={item !== "Weekly digest"} />
              </div>
            ))}
          </div>
        </Dialog>
      </Section>

      <Section
        title="Popover, menu & tooltip"
        description="Popover API: top layer + light dismiss from the platform, zero positioning libraries."
      >
        <Popover>
          <PopoverTrigger>
            <Button variant="outline">
              <Bell /> Notifications
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="font-medium">You're all caught up</p>
            <p className="mt-1 text-muted">New activity will show up here.</p>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => toast({ title: "Edited", variant: "success" })}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast({ title: "Copied to clipboard" })}>
              <Copy /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Settings /> Configure
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => toast({ title: "Deleted", variant: "danger" })}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip content="Sign out of all sessions">
          <Button variant="ghost" size="icon" aria-label="Sign out">
            <LogOut />
          </Button>
        </Tooltip>

        <span className="text-sm text-muted">
          Try <Kbd>Esc</Kbd> and outside clicks — handled natively.
        </span>
      </Section>

      <Section title="Forms" description="Field wires ids and ARIA automatically; Textarea grows with field-sizing.">
        <div className="grid w-full gap-6 @lg:grid-cols-2">
          <Field label="Email" description="We'll never share it." required>
            <Input type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Username" error="This username is already taken.">
            <Input defaultValue="nova" />
          </Field>
          <Field label="Plan">
            <Select defaultValue="pro">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </Field>
          <Field label="Bio" description="Auto-grows as you type (CSS field-sizing).">
            <Textarea placeholder="Tell us about yourself…" />
          </Field>
          <div className="flex items-center gap-3">
            <Checkbox id="tos" defaultChecked />
            <Label htmlFor="tos">I agree to the terms</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch defaultChecked />
            <Label>Email notifications</Label>
          </div>
        </div>
      </Section>

      <Section title="Tabs" description="Roving tabindex — use arrow keys, Home and End.">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-muted">
            Project health at a glance: deploys, errors and usage.
          </TabsContent>
          <TabsContent value="analytics" className="text-sm text-muted">
            Traffic is up 18% week over week.
          </TabsContent>
          <TabsContent value="reports" className="text-sm text-muted">
            Monthly reports are generated on the 1st.
          </TabsContent>
        </Tabs>
      </Section>

      <Section
        title="Accordion"
        description="Native <details name> — the browser enforces single-open. Height animates to auto via interpolate-size."
      >
        <Accordion type="single" className="w-full">
          <AccordionItem title="Is it accessible?" open>
            Yes — it's a native disclosure element, so semantics, keyboarding and even find-in-page
            auto-expand work out of the box.
          </AccordionItem>
          <AccordionItem title="Does it animate without JS?">
            Yes. `interpolate-size: allow-keywords` lets CSS transition height to `auto`; browsers without
            support simply snap open.
          </AccordionItem>
          <AccordionItem title="Why only one open at a time?">
            The `name` attribute groups the details elements; exclusivity is enforced by the browser, not a
            state library.
          </AccordionItem>
        </Accordion>
      </Section>

      <Section title="Feedback" description="Toasts, progress and skeletons.">
        <Button
          variant="outline"
          onClick={() =>
            toast({
              title: "Deployment complete",
              description: "nova-ui@0.1.0 is live in production.",
              variant: "success",
            })
          }
        >
          Show toast
        </Button>
        <div className="flex w-56 flex-col gap-2">
          <Progress value={progress} />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
              −10
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
              +10
            </Button>
          </div>
        </div>
        <Progress className="w-40" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Section>

      <Section title="Container queries" description="This card adapts to its own width (@container), not the viewport.">
        <div className="grid w-full gap-4 @xl:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Adaptive card {i}</CardTitle>
                <CardDescription>Resize the window — layout flips per-card.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 @sm:flex-row @sm:items-center">
                <Badge variant="success">healthy</Badge>
                <span className="text-sm text-muted">Stacks below 24rem, inline above.</span>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline">
                  Inspect
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      <footer className="pb-8 text-center text-sm text-subtle">
        Nova UI — built on the web platform. React 19 · Tailwind v4 · OKLCH · Popover API ·{" "}
        <code>&lt;dialog&gt;</code> · @starting-style
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Showcase />
    </ToastProvider>
  );
}
