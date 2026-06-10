import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronRight,
  Copy,
  FileText,
  FolderOpen,
  Globe,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  MoreHorizontal,
  Pencil,
  Rocket,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  Zap,
} from "lucide-react";
import {
  // Core
  Accordion, AccordionItem,
  Alert, AlertDialog,
  Avatar,
  Badge,
  Breadcrumb, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbEllipsis,
  Button,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Carousel, CarouselItem,
  Checkbox,
  Collapsible, CollapsibleContent, CollapsibleTrigger,
  Combobox,
  CommandProvider, useCommand, useRegisterCommands,
  ContextMenu,
  DataGrid,
  DataTable,
  DatePicker,
  DateRangePicker,
  Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  DonutChart,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
  Field,
  FileUpload,
  Heatmap,
  HoverCard, HoverCardContent, HoverCardTrigger,
  Input,
  Kbd,
  Label,
  LineChart,
  MentionInput,
  MultiSelect,
  NumberInput,
  PinInput,
  PivotTable,
  Popover, PopoverContent, PopoverTrigger,
  Progress,
  Rating,
  ScrollArea,
  Select,
  Separator,
  Sidebar, SidebarGroup, SidebarItem, SidebarProvider, SidebarToggle,
  Skeleton,
  Slider,
  Sparkline,
  Stepper, useStepper,
  Switch,
  TagInput,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea,
  ThemeBuilder,
  TimePicker,
  ToastProvider,
  Tooltip,
  Tree,
  useToast,
  VirtualTable,
  // New charts
  ScatterChart,
  RadarChart,
  FunnelChart,
  BarChart,
  // Gantt
  GanttChart,
} from "../src";

function toggleTheme() {
  const flip = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("nova-theme", dark ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode) — theme still toggles, just isn't persisted.
    }
  };
  if (document.startViewTransition) document.startViewTransition(flip);
  else flip();
}

/** Copy text to the clipboard with a fallback for insecure contexts (e.g. http over LAN). */
async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
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

// ── Data ─────────────────────────────────────────────────────────────────────

const revenue = [
  { month: "Jan", revenue: 42_000, costs: 28_000 },
  { month: "Feb", revenue: 48_500, costs: 30_200 },
  { month: "Mar", revenue: 46_100, costs: 29_400 },
  { month: "Apr", revenue: 55_300, costs: 31_800 },
  { month: "May", revenue: 61_900, costs: 33_500 },
  { month: "Jun", revenue: 58_700, costs: 34_100 },
  { month: "Jul", revenue: 67_400, costs: 35_900 },
  { month: "Aug", revenue: 72_800, costs: 36_300 },
];

const traffic = [
  { label: "Organic search", value: 4820 },
  { label: "Direct", value: 2940 },
  { label: "Referral", value: 1610 },
  { label: "Social", value: 980 },
];

interface Member {
  name: string; role: string; status: string; commits: number; trend: number[];
}
const members: Member[] = [
  { name: "Alice Moreau",     role: "Engineer", status: "active",  commits: 312, trend: [4,6,5,9,12,10,14] },
  { name: "Bob Tremblay",     role: "Manager",  status: "away",    commits: 87,  trend: [3,2,4,3,2,5,4] },
  { name: "Chloé Gagnon",     role: "Designer", status: "active",  commits: 145, trend: [2,5,7,6,9,8,11] },
  { name: "David Roy",        role: "Engineer", status: "active",  commits: 268, trend: [8,7,9,11,10,13,12] },
  { name: "Emma Côté",        role: "Engineer", status: "offline", commits: 198, trend: [5,6,4,7,8,6,9] },
  { name: "Felix Lavoie",     role: "Designer", status: "away",    commits: 64,  trend: [1,3,2,4,3,5,4] },
  { name: "Gabrielle Roux",   role: "Manager",  status: "active",  commits: 102, trend: [4,3,5,6,5,7,6] },
  { name: "Hugo Bélanger",    role: "Engineer", status: "active",  commits: 231, trend: [6,8,7,10,9,12,11] },
  { name: "Iris Pelletier",   role: "Designer", status: "offline", commits: 119, trend: [3,4,5,4,6,5,7] },
  { name: "Jules Bergeron",   role: "Engineer", status: "active",  commits: 176, trend: [5,4,6,8,7,9,10] },
  { name: "Karine Demers",    role: "Manager",  status: "away",    commits: 93,  trend: [2,4,3,5,4,6,5] },
  { name: "Léo Fortin",       role: "Engineer", status: "active",  commits: 287, trend: [9,8,11,10,12,14,13] },
];
const statusVariant = { active: "success", away: "warning", offline: "neutral" } as const;

interface Sku { sku: string; product: string; category: string; price: number; stock: number; }
const initialInventory: Sku[] = [
  { sku: "NV-001", product: "Quantum keyboard",  category: "Hardware",    price: 149, stock: 42 },
  { sku: "NV-002", product: "Photon mouse",       category: "Hardware",    price: 79,  stock: 128 },
  { sku: "NV-003", product: "Nebula desk mat",    category: "Accessories", price: 29,  stock: 310 },
  { sku: "NV-004", product: "Pulse headset",      category: "Audio",       price: 199, stock: 17 },
  { sku: "NV-005", product: "Orbit webcam",       category: "Hardware",    price: 119, stock: 56 },
];

const pivotSales = (() => {
  const regions: Array<[string, string[]]> = [
    ["Americas", ["USA", "Canada", "Brazil"]],
    ["EMEA", ["France", "Germany", "UK"]],
    ["APAC", ["Japan", "Australia"]],
  ];
  const categories = ["Hardware", "Audio", "Accessories"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const rows: Array<{ region: string; country: string; category: string; quarter: string; revenue: number; units: number; }> = [];
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const [region, countries] of regions)
    for (const country of countries)
      for (const category of categories)
        for (const quarter of quarters) {
          if (rand() < 0.2) continue;
          const units = Math.round(20 + rand() * 180);
          rows.push({ region, country, category, quarter, units, revenue: Math.round(units * (40 + rand() * 160)) });
        }
  return rows;
})();

// 50 000 virtual rows
const bigData = Array.from({ length: 50_000 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${(i + 1).toString().padStart(5, "0")}`,
  role: ["Engineer", "Designer", "Manager", "Product"][i % 4],
  status: ["active", "away", "offline"][i % 3],
  commits: Math.round(10 + ((i * 37) % 500)),
}));

const heatmapData = (() => {
  const xLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const yLabels = ["00:00", "06:00", "12:00", "18:00"];
  return yLabels.flatMap((y, yi) =>
    xLabels.map((x, xi) => ({ x, y, value: Math.round(10 + ((xi * 7 + yi * 13) % 80)) }))
  );
})();

const treeNodes = [
  {
    id: "src", label: "src", icon: <FolderOpen className="size-4 text-yellow-500" />,
    children: [
      {
        id: "components", label: "components", icon: <FolderOpen className="size-4 text-yellow-500" />,
        children: [
          { id: "button", label: "button.tsx", icon: <FileText className="size-4 text-blue-400" /> },
          { id: "input",  label: "input.tsx",  icon: <FileText className="size-4 text-blue-400" /> },
          { id: "card",   label: "card.tsx",   icon: <FileText className="size-4 text-blue-400" /> },
        ],
      },
      {
        id: "lib", label: "lib", icon: <FolderOpen className="size-4 text-yellow-500" />,
        children: [
          { id: "cn",    label: "cn.ts",    icon: <FileText className="size-4 text-green-400" /> },
          { id: "pivot", label: "pivot.ts", icon: <FileText className="size-4 text-green-400" /> },
        ],
      },
    ],
  },
  { id: "index", label: "index.ts", icon: <FileText className="size-4 text-blue-400" /> },
];

const stepperSteps = [
  { id: "account",  label: "Account",  description: "Your credentials" },
  { id: "profile",  label: "Profile",  description: "Personal details" },
  { id: "plan",     label: "Plan",     description: "Choose a plan" },
  { id: "payment",  label: "Payment",  description: "Billing info" },
];

const mentionOptions = [
  { id: "alice", label: "Alice Moreau",   sublabel: "@alice" },
  { id: "bob",   label: "Bob Tremblay",   sublabel: "@bob" },
  { id: "chloe", label: "Chloé Gagnon",   sublabel: "@chloe" },
  { id: "david", label: "David Roy",      sublabel: "@david" },
];

// ── Gantt demo data ───────────────────────────────────────────────────────────

const ganttGroups = [
  { id: "design",  label: "Design",      color: "oklch(0.65 0.18 262)" },
  { id: "dev",     label: "Engineering", color: "oklch(0.65 0.18 145)" },
  { id: "launch",  label: "Launch",      color: "oklch(0.65 0.18 28)" },
];

const d = (offset: number) => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() + offset); return d; };

const ganttTasks = [
  { id: "t1",  groupId: "design",  label: "Wireframes",        start: d(-14), end: d(-7)  },
  { id: "t2",  groupId: "design",  label: "Design system",     start: d(-10), end: d(0),  progress: 70 },
  { id: "t3",  groupId: "design",  label: "Prototype review",  start: d(0),   end: d(0),  milestone: true },
  { id: "t4",  groupId: "dev",     label: "Auth module",       start: d(-7),  end: d(5),  progress: 45, dependencies: ["t1"] },
  { id: "t5",  groupId: "dev",     label: "API integration",   start: d(-2),  end: d(10), progress: 20, dependencies: ["t4"] },
  { id: "t6",  groupId: "dev",     label: "UI components",     start: d(0),   end: d(12), dependencies: ["t2"] },
  { id: "t7",  groupId: "dev",     label: "Testing",           start: d(10),  end: d(18), dependencies: ["t5", "t6"] },
  { id: "t8",  groupId: "launch",  label: "Beta release",      start: d(18),  end: d(18), milestone: true, dependencies: ["t7"] },
  { id: "t9",  groupId: "launch",  label: "Marketing push",    start: d(15),  end: d(22) },
  { id: "t10", groupId: "launch",  label: "GA launch",         start: d(22),  end: d(22), milestone: true, dependencies: ["t8"] },
];

function GanttDemo() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Gantt Chart</h2>
        <p className="text-sm text-muted">
          Drag bars to move · drag edges to resize · click labels to rename · drag the progress fill to update %.
          Add / delete tasks and groups · collapse groups · switch Day / Week / Month views.
          Milestones are diamonds · dependency arrows connect tasks.
        </p>
      </div>
      <GanttChart
        tasks={ganttTasks}
        groups={ganttGroups}
        defaultViewMode="week"
      />
    </section>
  );
}

// ── Showcase ──────────────────────────────────────────────────────────────────

function DemoCommands() {
  const { toast } = useToast();
  useRegisterCommands("demo", [
    { id: "theme-toggle", label: "Toggle theme", group: "Appearance", icon: <Sun className="size-4" />, shortcut: "⌘⇧T", onSelect: toggleTheme },
    { id: "toast-success", label: "Show success toast", group: "Demo", icon: <Sparkles className="size-4" />, onSelect: () => toast({ title: "Success!", variant: "success" }) },
    { id: "toast-error",   label: "Show error toast",   group: "Demo", icon: <Zap className="size-4" />,      onSelect: () => toast({ title: "Something went wrong", variant: "danger" }) },
  ]);
  return null;
}

function Showcase() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen]           = useState(false);
  const [sheetOpen, setSheetOpen]             = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [progress, setProgress]               = useState(62);
  const [inventory, setInventory]             = useState(initialInventory);
  const [country, setCountry]                 = useState<string>();
  const [tags, setTags]                       = useState<string[]>(["react", "typescript"]);
  const [date, setDate]                       = useState<Date>();
  const [dateRange, setDateRange]             = useState<{ from: Date; to: Date }>();
  const [volume, setVolume]                   = useState<number | [number, number]>(35);
  const [priceRange, setPriceRange]           = useState<number | [number, number]>([25, 75]);
  const [quantity, setQuantity]               = useState<number | null>(2);
  const [pin, setPin]                         = useState("");
  const [rating, setRating]                   = useState(3.5);
  const [skills, setSkills]                   = useState<string[]>(["react"]);
  const [timeValue, setTimeValue]             = useState({ hour: 9, minute: 30 });
  const stepper                               = useStepper(stepperSteps);
  const { setOpen: openPalette }              = useCommand();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <DemoCommands />

      {/* Header */}
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
        <div className="flex items-center gap-2">
          <Tooltip content="Toggle theme (View Transitions)">
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="dark:hidden" />
              <Moon className="hidden dark:block" />
            </Button>
          </Tooltip>
        </div>
      </header>

      {/* Command Palette */}
      <Section title="Command Palette" description="Press ⌘K (or Ctrl+K) anywhere — fuzzy search with bold highlights, recent history, and page-scoped commands.">
        <Button variant="outline" onClick={() => openPalette(true)}>
          Open palette <Kbd>⌘K</Kbd>
        </Button>
        <p className="text-sm text-muted">
          useRegisterCommands() lets any component contribute commands that appear at the top while it's mounted.
        </p>
      </Section>

      {/* Buttons */}
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
          <a href="#anchors"><Rocket /> As link</a>
        </Button>
      </Section>

      {/* Badges & Avatars */}
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

      {/* Dialog + Sheet */}
      <Section title="Top layer: dialog & sheet" description="Native <dialog> — focus trap, inert background and Esc are free. CSS-only enter/exit via @starting-style.">
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>Open sheet</Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogHeader>
            <DialogTitle>Delete workspace?</DialogTitle>
            <DialogDescription>This permanently removes the workspace and all of its data.</DialogDescription>
          </DialogHeader>
          <Field label="Type the workspace name to confirm" required>
            <Input placeholder="acme-production" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDialogOpen(false); toast({ title: "Workspace deleted", variant: "danger" }); }}>
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

      {/* Alert + AlertDialog */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Alerts & confirmation dialogs</h2>
          <p className="text-sm text-muted">In-page banners and action-required dialogs (no backdrop-click dismiss).</p>
        </div>
        <div className="flex flex-col gap-3">
          <Alert variant="info"    title="Info">Your trial ends in 7 days. Upgrade to keep access.</Alert>
          <Alert variant="success" title="Deployed" dismissible>nova-ui@1.0.0 is live in production.</Alert>
          <Alert variant="warning" title="High usage">You've used 85% of your monthly quota.</Alert>
          <Alert variant="danger"  title="Payment failed" dismissible>Update your card to avoid service interruption.</Alert>
        </div>
        <div>
          <Button variant="destructive" onClick={() => setAlertDialogOpen(true)}>Delete account</Button>
          <AlertDialog
            open={alertDialogOpen}
            onOpenChange={setAlertDialogOpen}
            title="Delete your account?"
            description="This will permanently delete your account and all associated data. This action cannot be undone."
            confirmLabel="Delete account"
            variant="danger"
            onConfirm={() => toast({ title: "Account deleted", variant: "danger" })}
          />
        </div>
      </section>

      {/* Popover / menu / tooltip */}
      <Section title="Popover, menu & tooltip" description="Popover API: top layer + light dismiss from the platform, zero positioning libraries.">
        <Popover>
          <PopoverTrigger>
            <Button variant="outline"><Bell /> Notifications</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="font-medium">You're all caught up</p>
            <p className="mt-1 text-muted">New activity will show up here.</p>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => toast({ title: "Edited", variant: "success" })}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast({ title: "Copied to clipboard" })}><Copy /> Duplicate</DropdownMenuItem>
            <DropdownMenuItem disabled><Settings /> Configure</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => toast({ title: "Deleted", variant: "danger" })}><Trash2 /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <HoverCard>
          <HoverCardTrigger>
            <Button variant="ghost"><User /> Hover me</Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex items-center gap-3">
              <Avatar fallback="AM" />
              <div>
                <p className="font-medium leading-tight">Alice Moreau</p>
                <p className="text-xs text-muted">@alice · Engineer</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">312 commits this month · joined Jan 2023</p>
          </HoverCardContent>
        </HoverCard>

        <Tooltip content="Sign out of all sessions">
          <Button variant="ghost" size="icon" aria-label="Sign out"><LogOut /></Button>
        </Tooltip>

        <span className="text-sm text-muted">Try <Kbd>Esc</Kbd> and outside clicks — handled natively.</span>
      </Section>

      {/* Context Menu */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Context Menu</h2>
          <p className="text-sm text-muted">Right-click anywhere in the target area — positioned at cursor with viewport-edge clamping.</p>
        </div>
        <ContextMenu items={[
          { type: "item", label: "Open",         icon: <FolderOpen className="size-4" />, onSelect: () => toast({ title: "Opened" }) },
          { type: "item", label: "Rename",        icon: <Pencil className="size-4" />,     onSelect: () => toast({ title: "Renamed" }) },
          { type: "item", label: "Duplicate",     icon: <Copy className="size-4" />,       onSelect: () => toast({ title: "Duplicated" }) },
          { type: "separator" },
          { type: "item", label: "Move to trash", icon: <Trash2 className="size-4" />,    onSelect: () => toast({ title: "Moved to trash", variant: "danger" }) },
        ]}>
          <div className="flex h-24 w-full items-center justify-center rounded-nova-lg border-2 border-dashed border-border text-sm text-muted select-none">
            Right-click here
          </div>
        </ContextMenu>
      </section>

      {/* Forms */}
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

      {/* Tabs */}
      <Section title="Tabs" description="Roving tabindex — use arrow keys, Home and End.">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-muted">Project health at a glance: deploys, errors and usage.</TabsContent>
          <TabsContent value="analytics" className="text-sm text-muted">Traffic is up 18% week over week.</TabsContent>
          <TabsContent value="reports" className="text-sm text-muted">Monthly reports are generated on the 1st.</TabsContent>
        </Tabs>
      </Section>

      {/* Accordion + Collapsible */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Accordion & Collapsible</h2>
          <p className="text-sm text-muted">
            Native <code>&lt;details name&gt;</code> — height animates to auto via interpolate-size. Collapsible is the single-item variant.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <Accordion type="single">
                <AccordionItem title="Is it accessible?" open>
                  Yes — it's a native disclosure element, so semantics, keyboarding and find-in-page auto-expand work out of the box.
                </AccordionItem>
                <AccordionItem title="Does it animate without JS?">
                  Yes. `interpolate-size: allow-keywords` lets CSS transition height to `auto`.
                </AccordionItem>
                <AccordionItem title="Why only one open at a time?">
                  The `name` attribute groups the details elements; exclusivity is enforced by the browser.
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col gap-2">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-nova-md px-3 py-2 text-sm font-medium hover:bg-surface-2">
                  Advanced settings
                  <ChevronRight className="size-4 transition-transform [[open]_&]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pt-2 pb-1 text-sm text-muted flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Verbose logging</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Experimental features</Label>
                    <Switch />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stepper */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Stepper</h2>
          <p className="text-sm text-muted">Multi-step wizard with animated connector lines. useStepper is headless.</p>
        </div>
        <Card>
          <CardContent className="p-6 flex flex-col gap-6">
            <Stepper steps={stepperSteps} currentStep={stepper.currentStep} />
            <p className="text-sm text-muted text-center">{stepperSteps[stepper.currentStep].description}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" disabled={stepper.isFirst} onClick={stepper.prev}>Back</Button>
              <Button disabled={stepper.isLast} onClick={stepper.next}>{stepper.isLast ? "Finish" : "Continue"}</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Breadcrumb */}
      <Section title="Breadcrumb" description="Middle items collapse into a dropdown when maxItems is set.">
        <Breadcrumb maxItems={4}>
          <BreadcrumbItem href="#">
            <Home className="size-3.5" />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="#">Projects</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="#">Nova UI</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="#">Components</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem current>Breadcrumb</BreadcrumbItem>
        </Breadcrumb>
        <BreadcrumbEllipsis />
      </Section>

      {/* Feedback */}
      <Section title="Feedback" description="Toasts, progress and skeletons.">
        <Button variant="outline" onClick={() => toast({ title: "Deployment complete", description: "nova-ui@0.1.0 is live in production.", variant: "success" })}>
          Show toast
        </Button>
        <div className="flex w-56 flex-col gap-2">
          <Progress value={progress} />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.max(0, p - 10))}>−10</Button>
            <Button size="sm" variant="ghost" onClick={() => setProgress((p) => Math.min(100, p + 10))}>+10</Button>
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

      {/* Charts */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Charts</h2>
          <p className="text-sm text-muted">Zero-dependency SVG charts on the OKLCH palette — hover for tooltips.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenue vs costs</CardTitle><CardDescription>Line + area, Catmull-Rom smoothed</CardDescription></CardHeader>
            <CardContent>
              <LineChart data={revenue} x="month" series={[{ key: "revenue", label: "Revenue" }, { key: "costs", label: "Costs" }]} area height={220} formatY={(v) => `$${(v / 1000).toFixed(0)}k`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Monthly comparison</CardTitle><CardDescription>Stacked bars</CardDescription></CardHeader>
            <CardContent>
              <BarChart data={revenue} x="month" series={[{ key: "revenue", label: "Revenue" }, { key: "costs", label: "Costs" }]} stacked height={220} formatY={(v) => `$${(v / 1000).toFixed(0)}k`} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Traffic sources</CardTitle><CardDescription>Donut with hoverable slices + sparklines</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap items-center gap-10">
              <DonutChart data={traffic} />
              <div className="flex flex-col gap-3">
                {[
                  { label: "Sessions", data: [120,132,128,145,160,152,171] },
                  { label: "Sign-ups", data: [8,12,9,14,18,16,22] },
                  { label: "Churn",    data: [9,8,8,7,6,7,5], color: "var(--nova-chart-4)" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-muted">{kpi.label}</span>
                    <Sparkline data={kpi.data} color={kpi.color} />
                    <span className="text-sm font-medium tabular-nums">{kpi.data[kpi.data.length - 1]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Activity heatmap</CardTitle><CardDescription>CSS color-mix(in oklch) — perceptually uniform</CardDescription></CardHeader>
            <CardContent>
              <Heatmap data={heatmapData} cellSize={40} showValues title="Requests / hour" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Scatter / Bubble</CardTitle><CardDescription>Nearest-point hover tooltip; bubble radius from data</CardDescription></CardHeader>
            <CardContent>
              <ScatterChart
                height={220}
                data={members.map(m => ({ name: m.name, commits: m.commits, score: m.trend.reduce((a,b) => a+b,0), size: m.commits }))}
                series={[{ key: "commits", yKey: "score", sizeKey: "size", label: "Team members" }]}
                xLabel="Commits" yLabel="Activity score"
                formatX={(v) => String(Math.round(v))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Radar / Spider</CardTitle><CardDescription>Multi-axis comparison with polygon fill</CardDescription></CardHeader>
            <CardContent className="flex justify-center">
              <RadarChart
                height={220}
                axes={["Speed", "Reliability", "Security", "Scalability", "DX", "Performance"]}
                data={{ Speed: 85, Reliability: 92, Security: 78, Scalability: 88, DX: 95, Performance: 90 }}
                maxValue={100}
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Conversion funnel</CardTitle><CardDescription>Trapezoid stages with drop-off percentages</CardDescription></CardHeader>
            <CardContent>
              <FunnelChart
                height={220}
                showValues
                showPercent
                data={[
                  { label: "Visitors",   value: 10_000 },
                  { label: "Leads",      value: 6_200 },
                  { label: "Trials",     value: 2_400 },
                  { label: "Customers",  value: 960 },
                ]}
                formatValue={(v) => v.toLocaleString()}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Data Table */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Data table</h2>
          <p className="text-sm text-muted">Search, sort, paginate, select rows, toggle columns — headless useDataTable underneath.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <DataTable
              data={members}
              columns={[
                { key: "name",    header: "Name",    sortable: true, pinned: true },
                { key: "role",    header: "Role",    sortable: true },
                { key: "status",  header: "Status",  render: (m) => <Badge variant={statusVariant[m.status as keyof typeof statusVariant]}>{m.status}</Badge> },
                { key: "commits", header: "Commits", sortable: true, align: "right" },
                { key: "trend",   header: "Activity", render: (m) => <Sparkline data={m.trend} width={80} height={22} /> },
              ]}
              pageSize={5}
              selectable
              getRowId={(m) => m.name}
            />
          </CardContent>
        </Card>
      </section>

      {/* Virtual Table */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Virtual table</h2>
          <p className="text-sm text-muted">50,000 rows rendered with CSS contain:strict — only visible rows hit the DOM. No TanStack Virtual.</p>
        </div>
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-nova-lg">
            <VirtualTable
              data={bigData}
              getRowId={(r) => r.id}
              height={320}
              sortable
              selectable
              columns={[
                { key: "id",     header: "#",      align: "right" },
                { key: "name",   header: "Name",   sortable: true },
                { key: "role",   header: "Role",   sortable: true },
                { key: "status", header: "Status", render: (r) => <Badge variant={statusVariant[r.status as keyof typeof statusVariant]}>{r.status}</Badge> },
                { key: "commits", header: "Commits", sortable: true, align: "right" },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Data Grid */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Data grid</h2>
          <p className="text-sm text-muted">Spreadsheet keys: arrows move, Enter/F2 or double-click edits, type to replace, Esc cancels.</p>
        </div>
        <DataGrid
          data={inventory}
          columns={[
            { key: "sku",      header: "SKU",       width: "90px" },
            { key: "product",  header: "Product",   editable: true },
            { key: "category", header: "Category",  type: "select", options: ["Hardware", "Accessories", "Audio"], editable: true },
            { key: "price",    header: "Price ($)", type: "number", editable: true, align: "right" },
            { key: "stock",    header: "Stock",     type: "number", editable: true, align: "right" },
          ]}
          onRowChange={(row, i) => {
            setInventory((prev) => prev.map((r, ri) => (ri === i ? row : r)));
            toast({ title: `${row.sku} updated`, variant: "success", duration: 1800 });
          }}
        />
      </section>

      {/* Pivot Table */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pivot table</h2>
          <p className="text-sm text-muted">Drop fields into Rows, Columns and Values; pick the aggregation per value. Click a chevron to collapse a group.</p>
        </div>
        <PivotTable
          data={pivotSales}
          fields={[
            { key: "region",   label: "Region",   numeric: false },
            { key: "country",  label: "Country",  numeric: false },
            { key: "category", label: "Category", numeric: false },
            { key: "quarter",  label: "Quarter",  numeric: false },
            { key: "revenue",  label: "Revenue" },
            { key: "units",    label: "Units" },
          ]}
          defaultConfig={{ rows: ["region", "country"], columns: ["quarter"], values: [{ key: "revenue", aggregation: "sum" }] }}
          format={(n, v) =>
            v.key === "revenue" && v.aggregation !== "count"
              ? `$${Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)}`
              : Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n)
          }
        />
      </section>

      {/* Advanced inputs */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Advanced inputs</h2>
          <p className="text-sm text-muted">Combobox, tags, date pickers, time picker, range select, mention input, rating — all dependency-free.</p>
        </div>
        <Card>
          <CardContent className="grid gap-6 p-6 @lg:grid-cols-2">
            <Field label="Country" description="ARIA 1.2 combobox — type to filter.">
              <Combobox value={country} onValueChange={setCountry} placeholder="Search countries…"
                options={[
                  { value: "ca", label: "Canada" }, { value: "fr", label: "France" },
                  { value: "de", label: "Germany" }, { value: "jp", label: "Japan" },
                  { value: "us", label: "United States" },
                ]}
              />
            </Field>

            <Field label="Skills" description="Enter or comma adds; Backspace removes.">
              <TagInput value={tags} onValueChange={setTags} suggestions={["react","typescript","css","node","rust","python"]} placeholder="Add a skill…" />
            </Field>

            <Field label="Launch date" description="Full keyboard grid: arrows, PageUp/Down.">
              <DatePicker value={date} onValueChange={setDate} />
            </Field>

            <Field label="Date range" description="Two-month range picker with presets.">
              <DateRangePicker value={dateRange} onChange={setDateRange} defaultPresets />
            </Field>

            <Field label="Meeting time" description="CSS scroll-snap wheels — no JS for snapping.">
              <TimePicker value={timeValue} onChange={setTimeValue} />
            </Field>

            <Field label="Technologies" description="Multi-select with chip display.">
              <MultiSelect
                value={skills}
                onChange={setSkills}
                options={[
                  { value: "react",      label: "React" },
                  { value: "typescript", label: "TypeScript" },
                  { value: "node",       label: "Node.js" },
                  { value: "graphql",    label: "GraphQL" },
                  { value: "rust",       label: "Rust" },
                  { value: "python",     label: "Python" },
                ]}
                placeholder="Select technologies…"
              />
            </Field>

            <Field label="Quantity" description="Steppers, arrow keys, clamped 1–99.">
              <NumberInput value={quantity} onValueChange={setQuantity} min={1} max={99} />
            </Field>

            <Field label="One-time code">
              <PinInput length={6} value={pin} onValueChange={setPin} />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label>Volume — {volume as number}%</Label>
              <Slider value={volume} onValueChange={setVolume} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Price range — ${(priceRange as [number, number])[0]} to ${(priceRange as [number, number])[1]}</Label>
              <Slider value={priceRange} onValueChange={setPriceRange} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Review — {rating} / 5</Label>
              <Rating value={rating} onChange={setRating} allowHalf />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Attachments</Label>
              <FileUpload accept="image/*,.pdf" maxSize={5 * 1024 * 1024} />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Mention Input */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Mention Input</h2>
          <p className="text-sm text-muted">Contenteditable with @trigger detection — no rich-text library. Mentions become non-editable chips.</p>
        </div>
        <Card>
          <CardContent className="p-4">
            <MentionInput
              placeholder="Write a comment, use @ to mention someone…"
              onMentionSearch={(q) => mentionOptions.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>
      </section>

      {/* Scroll Area */}
      <Section title="Scroll Area" description="Custom thin scrollbar respecting the OKLCH theme — WebKit + Firefox.">
        <ScrollArea className="h-40 w-full rounded-nova-md border border-border">
          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Badge variant="neutral">{String(i + 1).padStart(2, "0")}</Badge>
                <span>Line item {i + 1} — scroll me to see the custom scrollbar</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      {/* Tree View */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tree View</h2>
          <p className="text-sm text-muted">Hierarchical data with expand/collapse, checkbox selection (indeterminate parents), full keyboard navigation.</p>
        </div>
        <Card>
          <CardContent className="p-4">
            <Tree nodes={treeNodes} selectable defaultExpanded={new Set(["src", "components"])} />
          </CardContent>
        </Card>
      </section>

      {/* Carousel */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Carousel</h2>
          <p className="text-sm text-muted">CSS scroll-snap — no JS for snapping. IntersectionObserver drives the active dot.</p>
        </div>
        <Carousel showDots showArrows>
          {["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b"].map((color, i) => (
            <CarouselItem key={i}>
              <div className="flex h-48 items-center justify-center rounded-nova-xl text-white text-2xl font-bold" style={{ background: color }}>
                Slide {i + 1}
              </div>
            </CarouselItem>
          ))}
        </Carousel>
      </section>

      {/* Sidebar */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Sidebar</h2>
          <p className="text-sm text-muted">CSS @property width transition — collapses to icon-only with tooltips. Press ⌘B to toggle.</p>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <SidebarProvider defaultCollapsed={false}>
              <div className="flex h-64">
                <Sidebar>
                  <SidebarGroup label="Main">
                    <SidebarItem icon={<LayoutDashboard />} active>Dashboard</SidebarItem>
                    <SidebarItem icon={<Users />}>Team</SidebarItem>
                    <SidebarItem icon={<Globe />}>Integrations</SidebarItem>
                  </SidebarGroup>
                  <SidebarGroup label="Account">
                    <SidebarItem icon={<Settings />}>Settings</SidebarItem>
                  </SidebarGroup>
                  <SidebarToggle />
                </Sidebar>
                <div className="flex flex-1 items-center justify-center text-sm text-muted">
                  Main content area — sidebar uses CSS @property for smooth width transition
                </div>
              </div>
            </SidebarProvider>
          </CardContent>
        </Card>
      </section>

      {/* Theme Builder */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Theme Builder</h2>
          <p className="text-sm text-muted">Live OKLCH token editor — move a slider and watch every component on this page update instantly.</p>
        </div>
        <ThemeBuilder
          onExport={(css) => {
            void copyToClipboard(css).then((ok) =>
              toast(
                ok
                  ? { title: "CSS copied to clipboard!", variant: "success" }
                  : { title: "Couldn't copy — clipboard unavailable", variant: "danger" },
              ),
            );
          }}
        />
      </section>

      {/* Container queries */}
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
              <CardFooter><Button size="sm" variant="outline">Inspect</Button></CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      {/* Gantt Chart */}
      <GanttDemo />

      <footer className="pb-8 text-center text-sm text-subtle">
        Nova UI — next-gen component library · React 19 · Tailwind v4 · OKLCH · Popover API · &lt;dialog&gt; · @starting-style
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <CommandProvider>
        {/* CommandProvider already renders the palette — rendering a second
            <CommandPalette /> here would open two modal dialogs at once. */}
        <Showcase />
      </CommandProvider>
    </ToastProvider>
  );
}
