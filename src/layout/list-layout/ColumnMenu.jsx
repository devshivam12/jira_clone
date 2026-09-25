import { useMemo, useState } from "react";
import { Columns3, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LIST_COLUMNS } from "./listColumns";

// The column menu, at the right of the list toolbar.
//
// It reads the column list, so every column the list knows about shows up here
// without being named twice. Ticking one shows it right away: the values are
// already on the rows, so nothing is fetched.
//
// Two sections, because showing every column at once makes the list hard to
// read: the ones on screen now, and everything else that can be added.
const ColumnMenu = ({ visibleIds, onToggle, onReset }) => {
    const [search, setSearch] = useState("");

    const { shown, more } = useMemo(() => {
        const term = search.trim().toLowerCase();
        const matches = LIST_COLUMNS.filter((column) => (
            !term || column.label.toLowerCase().includes(term)
        ));

        return {
            shown: matches.filter((column) => visibleIds.includes(column.id)),
            more: matches.filter((column) => !visibleIds.includes(column.id))
        };
    }, [search, visibleIds]);

    const renderRow = (column) => {
        const checked = visibleIds.includes(column.id);
        return (
            <label
                key={column.id}
                className={`flex items-center gap-3 rounded px-2 py-2 text-sm ${
                    column.locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-neutral-100'
                }`}
                title={column.locked ? 'This column is always shown' : undefined}
            >
                <Checkbox
                    checked={checked}
                    disabled={column.locked}
                    onCheckedChange={() => onToggle(column.id)}
                />
                <span className="text-neutral-600">{column.label}</span>
            </label>
        );
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="sm" variant="advanceMuted" className="h-9 px-3 text-sm">
                    <Columns3 size={15} className="mr-1.5" />
                    Columns
                    <span className="ml-1.5 rounded bg-neutral-200 px-1.5 text-[11px] font-medium text-neutral-600">
                        {visibleIds.length}
                    </span>
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b p-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search columns"
                            className="h-8 pl-8 text-sm"
                        />
                    </div>
                </div>

                <div className="max-h-[320px] overflow-y-auto p-1">
                    {shown.length > 0 && (
                        <>
                            <p className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                                Displayed columns
                            </p>
                            {shown.map(renderRow)}
                        </>
                    )}

                    {more.length > 0 && (
                        <>
                            <p className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                                More columns
                            </p>
                            {more.map(renderRow)}
                        </>
                    )}

                    {shown.length === 0 && more.length === 0 && (
                        <p className="px-2 py-6 text-center text-sm text-neutral-500">
                            No column matches that name.
                        </p>
                    )}
                </div>

                <div className="border-t p-2">
                    <Button size="sm" variant="ghost" className="h-8 w-full text-xs" onClick={onReset}>
                        Reset to default columns
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ColumnMenu;
