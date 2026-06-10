import { useRef, useState, type DragEvent } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FileUploadProps {
  /** Accept attribute, e.g. "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  /** Per-file size limit in bytes. */
  maxSize?: number;
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** Drag-and-drop upload zone with a removable file list. */
export function FileUpload({
  accept,
  multiple = true,
  maxSize,
  disabled,
  onFilesChange,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (incoming: FileList | File[]) => {
    setError(null);
    let next = Array.from(incoming);
    if (maxSize) {
      const tooBig = next.filter((f) => f.size > maxSize);
      if (tooBig.length > 0) {
        setError(`${tooBig.map((f) => f.name).join(", ")} exceed${tooBig.length === 1 ? "s" : ""} ${formatSize(maxSize)}.`);
        next = next.filter((f) => f.size <= maxSize);
      }
    }
    const merged = multiple ? [...files, ...next] : next.slice(0, 1);
    setFiles(merged);
    onFilesChange?.(merged);
  };

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesChange?.(next);
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-nova-lg border-2 border-dashed p-8 text-center",
          "transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-accent bg-accent-soft/40" : "border-border-strong hover:border-accent/60",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Upload className={cn("size-6", dragging ? "text-accent" : "text-muted")} />
        <p className="text-sm font-medium">
          {dragging ? "Drop to upload" : "Drag files here or click to browse"}
        </p>
        <p className="text-xs text-muted">
          {accept ? `Accepted: ${accept}` : "Any file type"}
          {maxSize ? ` · up to ${formatSize(maxSize)}` : ""}
        </p>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </button>

      {error && (
        <p role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2.5 rounded-nova border bg-surface px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-muted" />
              <span className="truncate">{f.name}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-subtle">{formatSize(f.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => remove(i)}
                className="shrink-0 rounded-nova-sm p-0.5 text-subtle outline-none transition-colors hover:text-danger focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
