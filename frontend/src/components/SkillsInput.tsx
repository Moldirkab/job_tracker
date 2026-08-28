import { useState } from "react";
import type { KeyboardEvent } from "react";

interface SkillsInputProps {
  value: string[];
  onChange: (skills: string[]) => void;
  disabled?: boolean;
}

export default function SkillsInput({
  value,
  onChange,
  disabled,
}: SkillsInputProps) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const skill = draft.trim();
    if (!skill) return;
    if (
      value.some((existing) => existing.toLowerCase() === skill.toLowerCase())
    ) {
      setDraft("");
      return;
    }
    onChange([...value, skill]);
    setDraft("");
  }

  function removeSkill(skill: string) {
    onChange(value.filter((s) => s !== skill));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={`flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border border-border-strong bg-white px-2.5 py-1.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      {value.map((skill) => (
        <span
          key={skill}
          className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
        >
          {skill}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
              className="text-brand-700/60 hover:text-brand-700"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        disabled={disabled}
        placeholder={
          value.length === 0 ? "Type a skill and press Enter..." : ""
        }
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint disabled:cursor-not-allowed"
      />
    </div>
  );
}
