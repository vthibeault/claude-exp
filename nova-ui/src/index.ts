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

import "./styles/nova.css";
