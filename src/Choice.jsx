import { useEffect, useRef, useState, useId } from "react";
export default function Choice({
  label,
  value,
  onChange,
  items,
  disabled = false,
  emptyLabel = "—",
}) {
  const [open, setOpen] = useState(false);
  const root = useRef(null),
    trigger = useRef(null);
  const id = useId();
  const chosen = items.find((x) => x.value === value) || items[0];
  useEffect(() => {
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => {
    if (open) root.current?.querySelector('[aria-selected="true"]')?.focus();
  }, [open]);
  return (
    <div className="field" ref={root}>
      <span id={id + "-label"}>{label}</span>
      <button
        ref={trigger}
        type="button"
        className="choice-trigger"
        aria-labelledby={id + "-label " + id + "-value"}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled || !items.length}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp"].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={id + "-value"}>
          {chosen?.flag && <img src={chosen.flag} alt="" />}
          {chosen?.label || emptyLabel}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div
          className="choice-menu"
          role="listbox"
          aria-labelledby={id + "-label"}
          onKeyDown={(e) => {
            const buttons = [
              ...e.currentTarget.querySelectorAll("[role=option]"),
            ];
            const index = buttons.indexOf(document.activeElement);
            if (e.key === "Escape") {
              setOpen(false);
              trigger.current.focus();
            }
            if (e.key === "Tab") setOpen(false);
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              buttons[
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? buttons.length - 1
                    : (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        buttons.length) %
                      buttons.length
              ]?.focus();
            }
          }}
        >
          {items.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={item.value === chosen?.value}
              key={item.value}
              onClick={() => {
                onChange(item.value);
                setOpen(false);
                trigger.current.focus();
              }}
            >
              {item.flag && <img src={item.flag} alt="" />}
              <span>{item.label}</span>
              {item.value === chosen?.value && (
                <span aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
