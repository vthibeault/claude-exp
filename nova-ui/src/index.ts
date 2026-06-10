// Nova UI — public API

export { cn } from "./lib/cn";
export { Slot } from "./lib/slot";
export { useAnchorPosition } from "./lib/use-anchor-position";
export type { Side, Align } from "./lib/use-anchor-position";

export { Button, buttonVariants } from "./components/button";
export type { ButtonProps } from "./components/button";

export { Badge, badgeVariants } from "./components/badge";
export type { BadgeProps } from "./components/badge";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/card";

export { Input, Textarea } from "./components/input";
export type { InputProps, TextareaProps } from "./components/input";

export { Label } from "./components/label";
export { Field } from "./components/field";
export type { FieldProps } from "./components/field";

export { Switch } from "./components/switch";
export type { SwitchProps } from "./components/switch";

export { Checkbox } from "./components/checkbox";
export type { CheckboxProps } from "./components/checkbox";

export { Select } from "./components/select";
export type { SelectProps } from "./components/select";

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
export type { TabsProps, TabsTriggerProps, TabsContentProps } from "./components/tabs";

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./components/dialog";
export type { DialogProps } from "./components/dialog";

export { Popover, PopoverTrigger, PopoverContent } from "./components/popover";
export type { PopoverProps, PopoverContentProps } from "./components/popover";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./components/dropdown-menu";
export type { DropdownMenuProps, DropdownMenuItemProps } from "./components/dropdown-menu";

export { Tooltip } from "./components/tooltip";
export type { TooltipProps } from "./components/tooltip";

export { Accordion, AccordionItem } from "./components/accordion";
export type { AccordionProps, AccordionItemProps } from "./components/accordion";

export { ToastProvider, useToast } from "./components/toast";
export type { ToastOptions, ToastVariant } from "./components/toast";

export { Avatar } from "./components/avatar";
export type { AvatarProps } from "./components/avatar";

export { Progress } from "./components/progress";
export type { ProgressProps } from "./components/progress";

export { Skeleton } from "./components/skeleton";
export { Spinner } from "./components/spinner";
export { Kbd } from "./components/kbd";
export { Separator } from "./components/separator";
export type { SeparatorProps } from "./components/separator";

// Charts
export { LineChart, ChartTooltip } from "./components/charts/line-chart";
export type { LineChartProps, ChartSeries } from "./components/charts/line-chart";
export { BarChart } from "./components/charts/bar-chart";
export type { BarChartProps } from "./components/charts/bar-chart";
export { DonutChart } from "./components/charts/donut-chart";
export type { DonutChartProps, DonutSlice } from "./components/charts/donut-chart";
export { Sparkline } from "./components/charts/sparkline";
export type { SparklineProps } from "./components/charts/sparkline";
export { CHART_COLORS, niceTicks, scaleLinear } from "./components/charts/chart-utils";
export { useMeasure } from "./lib/use-measure";

// Data display
export { DataTable, useDataTable } from "./components/data-table";
export type { DataTableProps, DataTableColumn, UseDataTableOptions, SortDirection } from "./components/data-table";
export { DataGrid } from "./components/data-grid";
export type { DataGridProps, DataGridColumn, DataGridColumnType } from "./components/data-grid";
export { Pagination } from "./components/pagination";
export type { PaginationProps } from "./components/pagination";

// Advanced inputs
export { Combobox } from "./components/combobox";
export type { ComboboxProps, ComboboxOption } from "./components/combobox";
export { TagInput } from "./components/tag-input";
export type { TagInputProps } from "./components/tag-input";
export { Calendar } from "./components/calendar";
export type { CalendarProps } from "./components/calendar";
export { DatePicker } from "./components/date-picker";
export type { DatePickerProps } from "./components/date-picker";
export { Slider } from "./components/slider";
export type { SliderProps } from "./components/slider";
export { NumberInput } from "./components/number-input";
export type { NumberInputProps } from "./components/number-input";
export { PinInput } from "./components/pin-input";
export type { PinInputProps } from "./components/pin-input";
export { FileUpload } from "./components/file-upload";
export type { FileUploadProps } from "./components/file-upload";

import "./styles/nova.css";
