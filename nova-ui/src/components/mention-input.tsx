import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import { showPopover, hidePopover } from "@/lib/use-anchor-position";

export interface MentionOption {
  id: string;
  label: string;
  avatar?: string;
  sublabel?: string;
}

export interface MentionInputProps {
  value?: string;
  onChange?: (html: string) => void;
  onMentionSearch?: (query: string) => MentionOption[] | Promise<MentionOption[]>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  trigger?: string;
}

/** Strips mention chips to @label text and removes other HTML tags. */
export function getMentionText(html: string): string {
  // Replace mention chips with their @label text first
  const withMentions = html.replace(
    /<span[^>]*data-mention-id="[^"]*"[^>]*>([^<]*)<\/span>/gi,
    (_, inner) => inner,
  );
  // Strip remaining HTML tags
  const tmp = document.createElement("div");
  tmp.innerHTML = withMentions;
  return tmp.textContent ?? tmp.innerText ?? "";
}

interface PopoverPos {
  top: number;
  left: number;
}

export function MentionInput({
  value,
  onChange,
  onMentionSearch,
  placeholder = "Type @ to mention someone…",
  className,
  disabled = false,
  trigger = "@",
}: MentionInputProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MentionOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [popoverPos, setPopoverPos] = useState<PopoverPos>({ top: 0, left: 0 });
  // The query string currently being typed after the trigger
  const queryRef = useRef<string>("");

  // Sync external value → DOM (only on mount / external change, avoid cursor reset)
  const isComposing = useRef(false);
  useEffect(() => {
    if (editableRef.current && value !== undefined && !isComposing.current) {
      if (editableRef.current.innerHTML !== value) {
        editableRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const closeSuggestions = useCallback(() => {
    setOpen(false);
    setOptions([]);
    setActiveIndex(0);
    hidePopover(popoverRef.current);
  }, []);

  const openSuggestions = useCallback((pos: PopoverPos) => {
    setPopoverPos(pos);
    setOpen(true);
    // onDismiss syncs state when the fallback (no Popover API) light-dismiss
    // hides the panel — the native `toggle` event never fires there.
    showPopover(popoverRef.current, closeSuggestions);
  }, [closeSuggestions]);

  /** Find the trigger query from the current caret position. Returns null if not in a mention. */
  const getTriggerQuery = useCallback((): { query: string; range: Range } | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;

    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;

    const text = node.textContent ?? "";
    const offset = range.startOffset;
    const before = text.slice(0, offset);

    // Find the last occurrence of the trigger in the text before cursor
    const triggerIdx = before.lastIndexOf(trigger);
    if (triggerIdx === -1) return null;

    // Make sure there's no whitespace between trigger and cursor
    const query = before.slice(triggerIdx + trigger.length);
    if (/\s/.test(query)) return null;

    // Build a range for the trigger + query text so we can replace it
    const queryRange = document.createRange();
    queryRange.setStart(node, triggerIdx);
    queryRange.setEnd(node, offset);

    return { query, range: queryRange };
  }, [trigger]);

  const handleInput = useCallback(async () => {
    const el = editableRef.current;
    if (!el) return;

    onChange?.(el.innerHTML);

    if (!onMentionSearch) return;

    const result = getTriggerQuery();
    if (!result) {
      closeSuggestions();
      return;
    }

    queryRef.current = result.query;

    // Position popover at caret
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const caretRange = sel.getRangeAt(0);
    const rect = caretRange.getBoundingClientRect();

    const pos: PopoverPos = {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    };

    const found = await onMentionSearch(result.query);
    // Check that the query hasn't changed while we waited
    if (queryRef.current !== result.query) return;

    if (found.length === 0) {
      closeSuggestions();
      return;
    }

    setOptions(found);
    setActiveIndex(0);
    openSuggestions(pos);
  }, [onChange, onMentionSearch, getTriggerQuery, closeSuggestions, openSuggestions]);

  const insertMention = useCallback((option: MentionOption) => {
    const el = editableRef.current;
    if (!el) return;

    const result = getTriggerQuery();
    if (!result) {
      closeSuggestions();
      return;
    }

    // Replace trigger+query with the mention chip
    const { range } = result;
    range.deleteContents();

    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.mentionId = option.id;
    chip.className =
      "inline-flex items-center rounded-full bg-primary/10 text-primary text-sm px-2 py-0 font-medium cursor-default";
    chip.textContent = `${trigger}${option.label}`;

    // Insert chip then a space
    const space = document.createTextNode(" ");
    range.insertNode(space);
    range.insertNode(chip);

    // Move cursor after the space
    const sel = window.getSelection();
    if (sel) {
      const newRange = document.createRange();
      newRange.setStartAfter(space);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    closeSuggestions();
    onChange?.(el.innerHTML);
  }, [getTriggerQuery, trigger, closeSuggestions, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[activeIndex]) insertMention(options[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeSuggestions();
    }
  }, [open, options, activeIndex, insertMention, closeSuggestions]);

  // Scroll active item into view
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = listRef.current?.children[activeIndex];
    if (el && typeof (el as HTMLElement).scrollIntoView === "function") {
      (el as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Position the popover whenever it opens
  useEffect(() => {
    const floating = popoverRef.current;
    if (!floating || !open) return;
    floating.style.top = `${popoverPos.top}px`;
    floating.style.left = `${popoverPos.left}px`;
  }, [open, popoverPos]);

  return (
    <>
      <div
        ref={editableRef}
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        contentEditable={disabled ? "false" : "true"}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        className={cn(
          "min-h-[80px] w-full rounded-nova border border-border-strong bg-surface px-3 py-2 text-sm text-foreground shadow-nova-sm",
          "outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-subtle empty:before:pointer-events-none",
          className,
        )}
      />

      {/* Suggestion popover */}
      <div
        ref={popoverRef}
        popover="manual"
        role="listbox"
        aria-label="Mention suggestions"
        className={cn(
          "nova-popover fixed inset-auto m-0",
          "bg-surface border border-border rounded-nova-lg shadow-lg py-1 min-w-[220px] max-h-64 overflow-y-auto",
        )}
        style={{ top: popoverPos.top, left: popoverPos.left }}
      >
        <ul ref={listRef}>
          {options.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={i === activeIndex}
              onPointerDown={(e) => {
                e.preventDefault();
                insertMention(opt);
              }}
              onPointerEnter={() => setActiveIndex(i)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 hover:bg-surface-2 cursor-pointer",
                i === activeIndex && "bg-surface-2",
              )}
            >
              {opt.avatar ? (
                <img
                  src={opt.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover bg-surface-2 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-surface-2 shrink-0 flex items-center justify-center text-xs font-medium text-muted">
                  {opt.label.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex flex-col">
                <span className="text-sm font-medium text-foreground truncate">{opt.label}</span>
                {opt.sublabel && (
                  <span className="text-xs text-muted truncate">{opt.sublabel}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
