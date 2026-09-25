import { memo, useCallback, useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommonDropdownMenu from "@/components/common/CommonDropdownMenu";
import ListCell from "./ListCell";
import { EXPANDER_WIDTH, INDENT_PER_LEVEL } from "./listColumns";

// Width of the actions column at the end of every row.
export const ACTIONS_WIDTH = 44;

// One row of the list.
//
// The row draws only the columns it is given, so switching a column on or off
// in the column menu is all it takes to change what a row shows.
//
// The open/close arrow sits in a box of a fixed width in front of the first
// column, and a child row moves the arrow inside that box rather than moving
// the row. That is what keeps every column under its heading no matter how
// deep a row sits.
const ListRow = ({
    row,
    columns,
    ctx,
    depth = 0,
    isExpanded = false,
    canExpand = false,
    onToggle,
    menuItems
}) => {
    const handleRowClick = useCallback((event) => {
        // Anything that edits a value marks itself, so a click inside a cell
        // does not also open the item.
        if (event.target.closest('[data-no-row-click]')) return;
        ctx.onOpenRow(row._id);
    }, [ctx, row._id]);

    const handleToggle = useCallback((event) => {
        event.stopPropagation();
        onToggle?.(row._id);
    }, [onToggle, row._id]);

    return (
        <div
            onClick={handleRowClick}
            className={`flex h-11 w-max min-w-full items-center border-b border-neutral-100 text-sm transition-colors ${
                row.isFlagged ? 'bg-red-50/50 hover:bg-red-50' : 'bg-white hover:bg-neutral-50'
            }`}
        >
            <div
                data-no-row-click
                className="box-border flex shrink-0 items-center justify-start"
                style={{ width: EXPANDER_WIDTH, paddingLeft: depth * INDENT_PER_LEVEL }}
            >
                {canExpand ? (
                    <button
                        type="button"
                        onClick={handleToggle}
                        title={isExpanded ? 'Hide child items' : 'Show child items'}
                        className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-neutral-200"
                    >
                        {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                ) : null}
            </div>

            {columns.map((column) => {
                const isEditable = Boolean(column.updateKey) || column.type === 'flag';
                return (
                    <div
                        key={column.id}
                        style={{ width: column.width, minWidth: column.width }}
                        className="flex shrink-0 items-center px-2"
                        {...(isEditable ? { 'data-no-row-click': true } : {})}
                    >
                        <ListCell row={row} column={column} ctx={ctx} />
                    </div>
                );
            })}

            <div
                data-no-row-click
                style={{ width: ACTIONS_WIDTH, minWidth: ACTIONS_WIDTH }}
                className="flex shrink-0 items-center justify-center"
            >
                <RowActions row={row} menuItems={menuItems} />
            </div>
        </div>
    );
};

// The menu is only built once it is asked for. A page of rows would otherwise
// build a dropdown, its items and their submenus for every row on screen.
const RowActions = memo(({ row, menuItems }) => {
    const [open, setOpen] = useState(false);

    if (!open) {
        return (
            <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                title="More actions"
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen(true);
                }}
            >
                <MoreHorizontal className="h-4 w-4 text-neutral-400" />
            </Button>
        );
    }

    return (
        <CommonDropdownMenu
            items={menuItems(row)}
            defaultOpen={true}
            onOpenChange={(isOpen) => {
                if (!isOpen) setOpen(false);
            }}
        />
    );
});
RowActions.displayName = 'RowActions';

export default memo(ListRow, (previous, next) => (
    previous.row === next.row &&
    previous.columns === next.columns &&
    previous.ctx === next.ctx &&
    previous.depth === next.depth &&
    previous.isExpanded === next.isExpanded &&
    previous.canExpand === next.canExpand &&
    previous.menuItems === next.menuItems &&
    previous.onToggle === next.onToggle
));
