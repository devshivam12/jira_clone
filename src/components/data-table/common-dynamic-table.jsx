import React, { useEffect, useRef, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from '../ui/button';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DottedSeparator } from '../dotted-separator';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

// Header and body cells share one horizontal padding value so a column label
// always sits directly above its values. The table primitive gives TableHead
// px-2 and TableCell px-4, which left every heading 8px out of line.
const CELL_X = 'px-4';

// Columns opt into alignment through meta.align. Everything else stays left, so
// no single column can end up drifting on its own.
const ALIGN = {
    left: { head: 'justify-between', cell: 'text-left' },
    center: { head: 'justify-center', cell: 'text-center' },
    right: { head: 'justify-end', cell: 'text-right' },
};

const CommonDynamicTable = ({
    data,
    columns,
    defaultColumnVisibility = {},
    searchPlaceholder = "Search...",
    searchColumn = "email",
    showSearch = true,
    showPagination = true,
    sorting,
    onSortingChange,
    pagination,
    searchValue = {},
    onSearchChange,
    onPaginationChange,
    totalCount = 0,
    isLoading,
    pageSizeOptions = [10, 20, 30, 50, 100]

}) => {

    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState(defaultColumnVisibility);
    const [rowSelection, setRowSelection] = useState({});
    const [columnSearch, setColumnSearch] = useState(searchValue)
    const [openDropdowns, setOpenDropdowns] = useState({})

    // Toolbar search box. appliedSearch holds the value already sent upstream,
    // which skips the request on first render and stops the per column filter
    // from re-firing a search it just applied itself.
    const [toolbarSearch, setToolbarSearch] = useState('')
    const appliedSearch = useRef('')

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: onSortingChange,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        manualSorting: true,
        manualPagination: true,
        manualFiltering: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const resetToFirstPage = () => {
        onPaginationChange?.(prev => ({
            ...prev,
            pageIndex: 0
        }));
    };

    // Debounced toolbar search, using the same 500ms delay as the team page.
    useEffect(() => {
        if (appliedSearch.current === toolbarSearch) return

        const timer = setTimeout(() => {
            appliedSearch.current = toolbarSearch
            setColumnSearch(prev => ({ ...prev, [searchColumn]: toolbarSearch }))
            onSearchChange?.({ [searchColumn]: toolbarSearch })
            resetToFirstPage()
        }, 500)

        return () => clearTimeout(timer)
    }, [toolbarSearch, searchColumn])

    // The search column can be filtered from the toolbar or from its own header
    // dropdown. Whichever one runs, both show the value that is really applied.
    const syncToolbarSearch = (columnId, value) => {
        if (columnId !== searchColumn) return
        appliedSearch.current = value
        setToolbarSearch(value)
    };

    const handleSorting = (columnId, direction) => {
        const newSorting = [{ id: columnId, desc: direction === 'desc' }]
        onSortingChange(newSorting)
    }

    const closeDropdown = (columnId) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [columnId]: false
        }))
    };

    // Column filter with search
    const handleColumnSearch = (columnId, value) => {
        setColumnSearch(prev => ({
            ...prev,
            [columnId]: value
        }));
    };

    const handleSearchSubmit = (columnId) => {
        // Send only this column's filter to the parent
        const value = columnSearch[columnId] || '';
        onSearchChange({ [columnId]: value });
        resetToFirstPage();
        syncToolbarSearch(columnId, value);
        closeDropdown(columnId);
    };

    const resetColumnSearch = (columnId) => {
        // Clear the search value for this column
        setColumnSearch(prev => ({
            ...prev,
            [columnId]: ''
        }));

        // Send empty search to parent component
        onSearchChange({ [columnId]: '' });

        // Reset to first page
        resetToFirstPage();
        syncToolbarSearch(columnId, '');
        closeDropdown(columnId);
    };

    // Calculate pagination info
    const currentPage = pagination?.pageIndex + 1 || 1;
    const pageSize = pagination?.pageSize || 10;
    const totalPages = Math.ceil(totalCount / pageSize);
    const visibleColumnCount = table.getVisibleLeafColumns().length;

    // Skeleton rows stand in for the rows that are about to arrive, so the table
    // keeps its height instead of jumping once the data lands.
    const skeletonRows = Math.min(pageSize, totalCount || pageSize, 10);

    // Generate page numbers to display (window of pages around the current one)
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots.filter((page, index, arr) => {
            return page !== arr[index - 1] && (totalPages > 1 ? true : page === 1);
        });
    };

    const handlePageChange = (newPage) => {
        if (onPaginationChange && newPage >= 1 && newPage <= totalPages) {
            onPaginationChange(prev => ({
                ...prev,
                pageIndex: newPage - 1
            }));
        }
    };

    const handlePageSizeChange = (newPageSize) => {
        if (onPaginationChange) {
            onPaginationChange(prev => ({
                ...prev,
                pageSize: parseInt(newPageSize),
                pageIndex: 0 // Reset to first page when changing page size
            }));
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            {showSearch && (
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="h-10 border-neutral-300 pl-9 pr-9"
                        value={toolbarSearch}
                        onChange={(event) => setToolbarSearch(event.target.value)}
                    />
                    {toolbarSearch && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setToolbarSearch('')}
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-neutral-400 hover:text-neutral-600"
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear search</span>
                        </Button>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="rounded-md border">
                <Table className="table-fixed">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const { meta } = header.column.columnDef;
                                    const align = ALIGN[meta?.align] || ALIGN.left;

                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                'h-11 whitespace-nowrap bg-neutral-100 text-sm',
                                                CELL_X,
                                                meta?.headerClassName
                                            )}
                                            style={meta?.width ? { width: meta.width } : undefined}
                                        >
                                            <div className={cn('flex items-center gap-2', align.head)}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {header.column.columnDef.enableFiltering && (
                                                    <DropdownMenu
                                                        open={openDropdowns[header.column.id] || false}
                                                        onOpenChange={(isOpen) => setOpenDropdowns(prev => ({
                                                            ...prev,
                                                            [header.column.id]: isOpen
                                                        }))}
                                                    >
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="-my-1 h-7 w-7 shrink-0">
                                                                <Filter className="h-4 w-4" />
                                                                <span className="sr-only">
                                                                    Filter {header.column.id}
                                                                </span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="py-2 ">
                                                            <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                                                            {
                                                                header.column.columnDef.enableSorting !== false && (
                                                                    <>

                                                                        <DottedSeparator className='my-1' />
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSorting(header.column.id, 'asc')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <ArrowUp className="mr-2 h-4 w-4" />
                                                                            ASC
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleSorting(header.column.id, 'desc')}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <ArrowDown className="mr-2 h-4 w-4" />
                                                                            DSC
                                                                        </DropdownMenuItem>
                                                                        <DottedSeparator className='my-1' />
                                                                    </>
                                                                )
                                                            }

                                                            <div className="px-2 py-1">
                                                                <div className="relative">
                                                                    <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                                    <Input
                                                                        placeholder={`Search ${header.column.columnDef.header}`}
                                                                        className="h-8 pl-8"
                                                                        value={columnSearch[header.column.id] || ''}
                                                                        onChange={(event) => {
                                                                            handleColumnSearch(header.column.id, event.target.value);
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                handleSearchSubmit(header.column.id);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className='mt-2 flex items-center justify-end gap-x-2'>

                                                                    <Button
                                                                        variant="ghost"
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => resetColumnSearch(header.column.id)}
                                                                        className="text-neutral-500 font-medium"
                                                                    >
                                                                        Reset
                                                                    </Button>

                                                                    <Button
                                                                        variant="outline"
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={() => handleSearchSubmit(header.column.id)}
                                                                    >
                                                                        Search
                                                                    </Button>

                                                                </div>
                                                            </div>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>


                    <TableBody>
                        {isLoading ? (
                            // Show loading skeletons when isLoading is true
                            Array.from({ length: skeletonRows }).map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    {table.getVisibleLeafColumns().map(column => (
                                        <TableCell
                                            key={`skeleton-${column.id}-${index}`}
                                            className={cn('h-14', CELL_X)}
                                        >
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            // Show actual data when not loading and data exists
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map(cell => {
                                        const { meta } = cell.column.columnDef;
                                        const align = ALIGN[meta?.align] || ALIGN.left;

                                        return (
                                            <TableCell
                                                key={cell.id}
                                                className={cn(
                                                    'h-14 overflow-hidden text-sm text-neutral-600',
                                                    CELL_X,
                                                    align.cell,
                                                    meta?.cellClassName
                                                )}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            // Show empty state when no data and not loading
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumnCount}
                                    className="h-24 text-center text-sm text-muted-foreground"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Server-side Pagination */}
            {showPagination && totalCount > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-4">
                        {/* Rows per page selector */}
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-neutral-500">Rows per page</p>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={handlePageSizeChange}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {pageSizeOptions.map((size) => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results info. This used to read "of {totalCount}",
                            which showed the row count where a page count belongs. */}
                        <div className="text-sm font-medium text-neutral-500">
                            Page {currentPage} of {totalPages || 1}
                            <span className="text-neutral-400"> ({totalCount} total)</span>
                        </div>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center space-x-2">
                        {/* Previous button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                            {getVisiblePages().map((page, index) => {
                                if (page === '...') {
                                    return (
                                        <span key={`dots-${index}`} className="px-2 py-1 text-sm text-neutral-400">
                                            ...
                                        </span>
                                    );
                                }

                                // Only the page being viewed gets the filled
                                // style. Every number used to look selected.
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "teritary" : "ghost"}
                                        size="icon"
                                        onClick={() => handlePageChange(page)}
                                        disabled={isLoading}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* Next button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonDynamicTable;
