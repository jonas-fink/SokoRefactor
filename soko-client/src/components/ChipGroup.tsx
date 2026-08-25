import type { ReactNode } from 'react';

export interface ChipOption {
    key: string;
    label: string;
    icon?: ReactNode;
    endonym?: string;
}

interface ChipGroupProps {
    legend: string;
    options: ChipOption[];
    selected: string[];
    onToggle: (key: string) => void;
    hint?: string;
}

const ChipGroup = ({
    legend,
    options,
    selected,
    onToggle,
    hint,
}: ChipGroupProps) => (
    <fieldset className="flex flex-col gap-2">
        <legend className="label">{legend}</legend>
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    aria-pressed={selected.includes(o.key)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 [&_svg]:size-5 ${
                        selected.includes(o.key) ? 'chip-active' : 'chip'
                    }`}
                    onClick={() => onToggle(o.key)}
                >
                    {o.icon}
                    {o.label}
                    {o.endonym && (
                        <span lang={o.key} dir="auto" className="text-ink-mute">
                            · {o.endonym}
                        </span>
                    )}
                </button>
            ))}
        </div>
        {hint && <p className="text-ink-mute text-xs">{hint}</p>}
    </fieldset>
);

export default ChipGroup;
