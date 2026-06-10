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
  BarChart,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Combobox,
  DataGrid,
  DataTable,
  DatePicker,
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
  DonutChart,
  Field,
  FileUpload,
  Input,
  Kbd,
  Label,
  LineChart,
  NumberInput,
  PinInput,
  PivotTable,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Select,
  Separator,
  Skeleton,
  Slider,
  Sparkline,
  Switch,
  TagInput,
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
  name: string;
  role: string;
  status: string;
  commits: number;
  trend: number[];
}

const members: Member[] = [
  { name: "Alice Moreau", role: "Engineer", status: "active", commits: 312, trend: [4, 6, 5, 9, 12, 10, 14] },
  { name: "Bob Tremblay", role: "Manager", status: "away", commits: 87, trend: [3, 2, 4, 3, 2, 5, 4] },
  { name: "Chloé Gagnon", role: "Designer", status: "active", commits: 145, trend: [2, 5, 7, 6, 9, 8, 11] },
  { name: "David Roy", role: "Engineer", status: "active", commits: 268, trend: [8, 7, 9, 11, 10, 13, 12] },
  { name: "Emma Côté", role: "Engineer", status: "offline", commits: 198, trend: [5, 6, 4, 7, 8, 6, 9] },
  { name: "Felix Lavoie", role: "Designer", status: "away", commits: 64, trend: [1, 3, 2, 4, 3, 5, 4] },
  { name: "Gabrielle Roux", role: "Manager", status: "active", commits: 102, trend: [4, 3, 5, 6, 5, 7, 6] },
  { name: "Hugo Bélanger", role: "Engineer", status: "active", commits: 231, trend: [6, 8, 7, 10, 9, 12, 11] },
  { name: "Iris Pelletier", role: "Designer", status: "offline", commits: 119, trend: [3, 4, 5, 4, 6, 5, 7] },
  { name: "Jules Bergeron", role: "Engineer", status: "active", commits: 176, trend: [5, 4, 6, 8, 7, 9, 10] },
  { name: "Karine Demers", role: "Manager", status: "away", commits: 93, trend: [2, 4, 3, 5, 4, 6, 5] },
  { name: "Léo Fortin", role: "Engineer", status: "active", commits: 287, trend: [9, 8, 11, 10, 12, 14, 13] },
];

const statusVariant = { active: "success", away: "warning", offline: "neutral" } as const;

interface Sku {
  sku: string;
  product: string;
  category: string;
  price: number;
  stock: number;
}

const initialInventory: Sku[] = [
  { sku: "NV-001", product: "Quantum keyboard", category: "Hardware", price: 149, stock: 42 },
  { sku: "NV-002", product: "Photon mouse", category: "Hardware", price: 79, stock: 128 },
  { sku: "NV-003", product: "Nebula desk mat", category: "Accessories", price: 29, stock: 310 },
  { sku: "NV-004", product: "Pulse headset", category: "Audio", price: 199, stock: 17 },
  { sku: "NV-005", product: "Orbit webcam", category: "Hardware", price: 119, stock: 56 },
];

const pivotSales = (() => {
  const regions: Array<[string, string[]]> = [
    ["Americas", ["USA", "Canada", "Brazil"]],
    ["EMEA", ["France", "Germany", "UK"]],
    ["APAC", ["Japan", "Australia"]],
  ];
  const categories = ["Hardware", "Audio", "Accessories"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const rows: Array<{
    region: string;
    country: string;
    category: string;
    quarter: string;
    revenue: number;
    units: number;
  }> = [];
  let seed = 7;
  const rand = () => {
    // Deterministic pseudo-random so the demo is stable across reloads.
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (const [region, countries] of regions)
    for (const country of countries)
      for (const category of categories)
        for (const quarter of quarters) {
          if (rand() < 0.2) continue; // sparse combinations, like real data
          const units = Math.round(20 + rand() * 180);
          rows.push({
            region,
            country,
            category,
            quarter,
            units,
            revenue: Math.round(units * (40 + rand() * 160)),
          });
        }
  return rows;
})();

function Showcase() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [progress, setProgress] = useState(62);
  const [inventory, setInventory] = useState(initialInventory);
  const [country, setCountry] = useState<string>();
  const [tags, setTags] = useState<string[]>(["react", "typescript"]);
  const [date, setDate] = useState<Date>();
  const [volume, setVolume] = useState<number | [number, number]>(35);
  const [priceRange, setPriceRange] = useState<number | [number, number]>([25, 75]);
  const [quantity, setQuantity] = useState<number | null>(2);
  const [pin, setPin] = useState("");

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

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Charts</h2>
          <p className="text-sm text-muted">
            Zero-dependency SVG charts on the OKLCH palette — hover for tooltips.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs costs</CardTitle>
              <CardDescription>Line + area, smoothed</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                data={revenue}
                x="month"
                series={[
                  { key: "revenue", label: "Revenue" },
                  { key: "costs", label: "Costs" },
                ]}
                area
                height={220}
                formatY={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly comparison</CardTitle>
              <CardDescription>Grouped bars</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart
                data={revenue}
                x="month"
                series={[
                  { key: "revenue", label: "Revenue" },
                  { key: "costs", label: "Costs" },
                ]}
                height={220}
                formatY={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Traffic sources</CardTitle>
              <CardDescription>Donut with hoverable slices + inline sparklines</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-10">
              <DonutChart data={traffic} />
              <div className="flex flex-col gap-3">
                {[
                  { label: "Sessions", data: [120, 132, 128, 145, 160, 152, 171] },
                  { label: "Sign-ups", data: [8, 12, 9, 14, 18, 16, 22] },
                  { label: "Churn", data: [9, 8, 8, 7, 6, 7, 5], color: "var(--nova-chart-4)" },
                ].map((kpi) => (
                  <div key={kpi.label} className="flex items-center gap-3">
                    <span className="w-20 text-sm text-muted">{kpi.label}</span>
                    <Sparkline data={kpi.data} color={kpi.color} />
                    <span className="text-sm font-medium tabular-nums">
                      {kpi.data[kpi.data.length - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Data table</h2>
          <p className="text-sm text-muted">
            Search, sort, paginate, select rows, toggle columns — headless useDataTable underneath.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <DataTable
              data={members}
              columns={[
                { key: "name", header: "Name", sortable: true, pinned: true },
                { key: "role", header: "Role", sortable: true },
                {
                  key: "status",
                  header: "Status",
                  render: (m) => <Badge variant={statusVariant[m.status as keyof typeof statusVariant]}>{m.status}</Badge>,
                },
                { key: "commits", header: "Commits", sortable: true, align: "right" },
                {
                  key: "trend",
                  header: "Activity",
                  render: (m) => <Sparkline data={m.trend} width={80} height={22} />,
                },
              ]}
              pageSize={5}
              selectable
              getRowId={(m) => m.name}
            />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Data grid</h2>
          <p className="text-sm text-muted">
            Spreadsheet keys: arrows move, Enter/F2 or double-click edits, type to replace, Esc cancels.
          </p>
        </div>
        <DataGrid
          data={inventory}
          columns={[
            { key: "sku", header: "SKU", width: "90px" },
            { key: "product", header: "Product", editable: true },
            {
              key: "category",
              header: "Category",
              type: "select",
              options: ["Hardware", "Accessories", "Audio"],
              editable: true,
            },
            { key: "price", header: "Price ($)", type: "number", editable: true, align: "right" },
            { key: "stock", header: "Stock", type: "number", editable: true, align: "right" },
          ]}
          onRowChange={(row, i) => {
            setInventory((prev) => prev.map((r, ri) => (ri === i ? row : r)));
            toast({ title: `${row.sku} updated`, variant: "success", duration: 1800 });
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Pivot table</h2>
          <p className="text-sm text-muted">
            Drop fields into Rows, Columns and Values; pick the aggregation per value. Group rows carry
            their subtotal, with grand totals on the last row and column. Click a chevron to collapse a group.
          </p>
        </div>
        <PivotTable
          data={pivotSales}
          fields={[
            { key: "region", label: "Region", numeric: false },
            { key: "country", label: "Country", numeric: false },
            { key: "category", label: "Category", numeric: false },
            { key: "quarter", label: "Quarter", numeric: false },
            { key: "revenue", label: "Revenue" },
            { key: "units", label: "Units" },
          ]}
          defaultConfig={{
            rows: ["region", "country"],
            columns: ["quarter"],
            values: [{ key: "revenue", aggregation: "sum" }],
          }}
          format={(n, v) =>
            v.key === "revenue" && v.aggregation !== "count"
              ? `$${Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)}`
              : Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n)
          }
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Advanced inputs</h2>
          <p className="text-sm text-muted">
            Combobox, tags, date picker, sliders, steppers, OTP and file upload — all dependency-free.
          </p>
        </div>
        <Card>
          <CardContent className="grid gap-6 p-6 @lg:grid-cols-2">
            <Field label="Country" description="ARIA 1.2 combobox — type to filter.">
              <Combobox
                value={country}
                onValueChange={setCountry}
                placeholder="Search countries…"
                options={[
                  { value: "ca", label: "Canada" },
                  { value: "fr", label: "France" },
                  { value: "de", label: "Germany" },
                  { value: "jp", label: "Japan" },
                  { value: "br", label: "Brazil" },
                  { value: "au", label: "Australia" },
                  { value: "in", label: "India" },
                  { value: "us", label: "United States" },
                ]}
              />
            </Field>

            <Field label="Skills" description="Enter or comma adds; Backspace removes.">
              <TagInput
                value={tags}
                onValueChange={setTags}
                suggestions={["react", "typescript", "css", "node", "graphql", "rust", "python"]}
                placeholder="Add a skill…"
              />
            </Field>

            <Field label="Launch date" description="Full keyboard grid: arrows, PageUp/Down.">
              <DatePicker value={date} onValueChange={setDate} />
            </Field>

            <Field label="Quantity" description="Steppers, arrow keys, clamped 1–99.">
              <NumberInput value={quantity} onValueChange={setQuantity} min={1} max={99} />
            </Field>

            <div className="flex flex-col gap-1.5">
              <Label>Volume — {volume as number}%</Label>
              <Slider value={volume} onValueChange={setVolume} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Price range — ${(priceRange as [number, number])[0]} to ${(priceRange as [number, number])[1]}
              </Label>
              <Slider value={priceRange} onValueChange={setPriceRange} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>One-time code {pin.length === 6 && <Badge variant="success">verified</Badge>}</Label>
              <PinInput length={6} value={pin} onValueChange={setPin} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Attachments</Label>
              <FileUpload accept="image/*,.pdf" maxSize={5 * 1024 * 1024} />
            </div>
          </CardContent>
        </Card>
      </section>

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
