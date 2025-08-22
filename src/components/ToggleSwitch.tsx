// components/ToggleSwitch.tsx
"use client";

type ToggleSwitchProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

export default function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-4 w-10 items-center rounded-full transition-colors ${
        enabled ? "bg-blue-400" : "bg-gray-400"
      }`}
    >
      <span
        className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
