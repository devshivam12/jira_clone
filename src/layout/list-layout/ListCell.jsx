import { memo, useCallback, useState } from "react";
import { CalendarDays, ChevronDown, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import DynamicDropdownSelector from "@/components/common/DynamicDropdownSelector";
import LabelSelector from "@/components/common/LabelSelector";
import ManageAvatar from "@/components/common/ManageAvatar";
import WorkSelector from "@/components/common/WorkSelector";

// One cell of the list. Which of the pieces below is used comes from the
// column's `type`, so a new column needs no new file - only an entry in
// listColumns.js, and a new `type` here if it behaves in a new way.
//
// Editing is saved the moment a value is picked. The page hands us `onUpdate`,
// which shows the new value straight away and puts the old one back if the
// server refuses it.

const EMPTY = <span className="text-neutral-300">-</span>;

// The dropdown lists hand back their own shapes, so each one says how to read a
// name out of an item and what to keep on the row after a pick. Keeping this in
// one place is why the parent, team and sprint cells are the same code.
const ENTITY_KINDS = {
    parent: {
        read: (value) => value?.summary || '',
        shape: (item) => ({ _id: item._id, summary: item.summary, taskNumber: item.taskNumber })
    },
    team: {
        read: (value) => value?.name || '',
        shape: (item) => ({ _id: item._id, name: item.team_name })
    },
    sprint: {
        read: (value) => value?.name || '',
        shape: (item) => ({ _id: item._id, name: item.name })
    }
};

// A member is stored on the row as one `name` string, but the avatar wants the
// two halves, so the first word is read as the first name.
const avatarPropsFor = (member) => {
    const [firstWord, ...rest] = String(member?.name || '').trim().split(/\s+/);
    return { firstName: firstWord || '', lastName: rest.join(' '), image: member?.image };
};

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

// Reads as a plain value until it is clicked, and only then builds the real
// select. A row has several of these, and a page has many rows.
const OptionCell = ({ row, column, ctx }) => {
    const [open, setOpen] = useState(false);
    const options = ctx.optionLists[column.options] || [];
    const value = row[column.field] || '';
    const selected = options.find((option) => option.value === value) || null;

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={`flex w-full items-center gap-1 rounded-md px-2 py-1 text-left ${selected?.color || 'bg-neutral-100'}`}
            >
                <span className={`truncate text-xs font-medium ${selected?.color ? 'text-white' : 'text-neutral-500'}`}>
                    {selected?.name || 'Not set'}
                </span>
                <ChevronDown size={14} className={`ml-auto shrink-0 ${selected?.color ? 'text-white' : 'text-neutral-400'}`} />
            </button>
        );
    }

    return (
        <WorkSelector
            key={value}
            value={value}
            workTypes={options}
            defaultOpen={true}
            onOpenChange={(isOpen) => {
                if (!isOpen) setOpen(false);
            }}
            onChange={(next) => {
                setOpen(false);
                if (next && next !== value) ctx.onUpdate(row, column, next);
            }}
        />
    );
};

const MemberCell = ({ row, column, ctx }) => {
    const [open, setOpen] = useState(false);
    const member = row[column.field] || null;

    const handleChange = useCallback((selected) => {
        setOpen(false);
        const nextId = selected?._id || null;
        if (nextId === (member?._id || null)) return;

        const detail = selected
            ? {
                _id: selected._id,
                memberId: selected.memberId,
                image: selected.image,
                name: [selected.first_name, selected.last_name].filter(Boolean).join(' ') || selected.name || ''
            }
            : null;

        ctx.onUpdate(row, column, nextId, detail);
    }, [ctx, column, member, row]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button type="button" className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-neutral-100">
                    {member?._id
                        ? <ManageAvatar {...avatarPropsFor(member)} size="sm" showTooltip={false} />
                        : <ManageAvatar fallbackIcon={true} size="sm" showTooltip={false} />}
                    <span className="truncate text-xs text-neutral-600">{member?.name || 'Unassigned'}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-0" align="start">
                <DynamicDropdownSelector
                    slug="member"
                    showDropdown={true}
                    label="Search member"
                    projectId={ctx.projectId}
                    onChange={handleChange}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const EntityCell = ({ row, column, ctx }) => {
    const [open, setOpen] = useState(false);
    const kind = ENTITY_KINDS[column.slug];
    const value = row[column.field] || null;
    const text = kind ? kind.read(value) : '';

    const handleChange = useCallback((selected) => {
        setOpen(false);
        const nextId = selected?._id || null;
        if (nextId === (value?._id || null)) return;
        ctx.onUpdate(row, column, nextId, selected && kind ? kind.shape(selected) : null);
    }, [ctx, column, kind, row, value]);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    title={text}
                    className="flex w-full items-center rounded-md px-2 py-1 text-left hover:bg-neutral-100"
                >
                    <span className={`truncate text-xs ${text ? 'text-neutral-600' : 'text-neutral-300'}`}>
                        {text || '-'}
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-0" align="start">
                <DynamicDropdownSelector
                    slug={column.slug}
                    showDropdown={true}
                    label={`Search ${column.label.toLowerCase()}`}
                    projectId={ctx.projectId}
                    onChange={handleChange}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const TextCell = ({ row, column, ctx }) => {
    const original = row[column.field] || '';
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(original);

    const start = () => {
        setDraft(original);
        setEditing(true);
    };

    const save = () => {
        setEditing(false);
        const trimmed = draft.trim();
        if (!trimmed || trimmed === original) return;
        ctx.onUpdate(row, column, trimmed);
    };

    if (!editing) {
        return (
            <button
                type="button"
                onClick={start}
                title={original}
                className="w-full truncate rounded px-1 py-1 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
                {original || <span className="text-neutral-300">Add a summary</span>}
            </button>
        );
    }

    return (
        <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    save();
                }
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setEditing(false);
                }
            }}
            className="h-8 text-sm"
        />
    );
};

const DateCell = ({ row, column, ctx }) => {
    const [open, setOpen] = useState(false);
    const selected = toDate(row[column.field]);

    const commit = (value) => {
        setOpen(false);
        ctx.onUpdate(row, column, value);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left hover:bg-neutral-100">
                    <CalendarDays size={13} className="shrink-0 text-neutral-400" />
                    <span className={`truncate text-xs ${selected ? 'text-neutral-600' : 'text-neutral-300'}`}>
                        {selected ? ctx.formatDate(selected) : 'Set date'}
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selected || undefined}
                    defaultMonth={selected || undefined}
                    onSelect={(date) => {
                        if (!date) return;
                        commit(date.toISOString());
                    }}
                />
                {selected && (
                    <div className="border-t p-2">
                        <Button size="sm" variant="ghost" className="h-8 w-full text-xs" onClick={() => commit(null)}>
                            <X size={13} className="mr-1" />
                            Clear date
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

const FlagCell = ({ row, ctx }) => (
    <button
        type="button"
        onClick={() => ctx.onToggleFlag(row)}
        title={row.isFlagged ? (row.flagReason || 'Remove flag') : 'Add flag'}
        className="flex h-7 w-full items-center justify-center rounded-md hover:bg-neutral-100"
    >
        <Flag
            size={14}
            className={row.isFlagged ? 'text-red-500' : 'text-neutral-300'}
            fill={row.isFlagged ? 'currentColor' : 'none'}
        />
    </button>
);

const KeyCell = ({ row, ctx }) => {
    const workType = ctx.workTypeMap?.get(row.work_type);
    const taskKey = row.project_key && row.taskNumber ? `${row.project_key}-${row.taskNumber}` : '';

    return (
        <button
            type="button"
            onClick={() => ctx.onOpenRow(row._id)}
            className="flex w-full items-center gap-1.5 text-left"
        >
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${workType?.color || 'bg-neutral-200'}`}>
                {workType?.icon && (
                    <img
                        src={workType.icon}
                        alt={workType.name || row.work_type}
                        loading="lazy"
                        decoding="async"
                        className="h-2.5 w-2.5 brightness-0 invert filter"
                    />
                )}
            </span>
            <span className="truncate text-xs font-semibold text-neutral-500 underline decoration-dotted hover:text-blue-600">
                {taskKey || 'No key'}
            </span>
        </button>
    );
};

const LabelsCell = ({ row, column, ctx }) => (
    <LabelSelector
        value={row[column.field] || []}
        onChange={(labels) => ctx.onUpdate(row, column, labels || [])}
        className="max-h-8 overflow-hidden py-0"
    />
);

const ListCell = ({ row, column, ctx }) => {
    switch (column.type) {
        case 'key':
            return <KeyCell row={row} ctx={ctx} />;

        case 'text':
            return <TextCell row={row} column={column} ctx={ctx} />;

        case 'options':
            return <OptionCell row={row} column={column} ctx={ctx} />;

        case 'member':
            return <MemberCell row={row} column={column} ctx={ctx} />;

        case 'entity':
            return <EntityCell row={row} column={column} ctx={ctx} />;

        case 'labels':
            return <LabelsCell row={row} column={column} ctx={ctx} />;

        case 'date':
            return <DateCell row={row} column={column} ctx={ctx} />;

        case 'flag':
            return <FlagCell row={row} ctx={ctx} />;

        case 'readDate': {
            const value = toDate(row[column.field]);
            return <span className="truncate text-xs text-neutral-500">{value ? ctx.formatDate(value) : EMPTY}</span>;
        }

        case 'readMember': {
            const member = row[column.field];
            if (!member?._id) return EMPTY;
            return (
                <span className="flex items-center gap-2">
                    <ManageAvatar {...avatarPropsFor(member)} size="sm" showTooltip={false} />
                    <span className="truncate text-xs text-neutral-600">{member.name}</span>
                </span>
            );
        }

        case 'readNumber': {
            const value = row[column.field];
            return (
                <span className="text-xs text-neutral-500">
                    {value === null || value === undefined || value === '' ? EMPTY : value}
                </span>
            );
        }

        default:
            return EMPTY;
    }
};

// A row only redraws a cell when that cell's own value changed, which keeps a
// wide list with many columns from rebuilding everything on one edit.
export default memo(ListCell, (previous, next) => (
    previous.column === next.column &&
    previous.ctx === next.ctx &&
    previous.row === next.row
));
