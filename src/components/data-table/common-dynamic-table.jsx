import React, { useMemo, useState } from 'react'; // Added useState import
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
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from '../ui/button';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Filter, MoreHorizontal, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


const CommonDynamicTable = ({
    data,
    columns,
    defaultSorting = [],
    defaultColumnVisibility = {},
    searchPlaceholder = "Search...",
    searchColumn = "email",
    showColumnVisibility = true,
    showPagination = true,
    pagination,
    onPaginationChange,
    totalCount = 0,
    isLoading = false,
    pageSizeOptions = [10, 20, 30, 50, 100]

}) => {
    const [sorting, setSorting] = useState(defaultSorting);
    const [columnFilters, setColumnFilters] = useState([]);
    const [columnVisibility, setColumnVisibility] = useState(defaultColumnVisibility);
    const [rowSelection, setRowSelection] = useState({});
    const [columnSearch, setColumnSearch] = useState({})

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        // Disable client-side pagination since we're using server-side
        manualPagination: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    // column filter with search

    const handleColumnSearch = (columnId, value) => {
        setColumnSearch(prev => ({
            ...prev,
            [columnId]: value
        }))

        const column = table.getColumn(columnId)
        if (column) {
            column.setFilterValue(value)
        }
    }

    // Get all filterable columns
    const filterableColumns = useMemo(() => {
        return columns.filter(column => column.enableFiltering !== false);
    }, [columns]);

    // Safely get the search column
    const searchColumnInstance = table.getColumn(searchColumn);

    // Calculate pagination info
    const currentPage = pagination?.pageIndex + 1 || 1;
    const pageSize = pagination?.pageSize || 10;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Generate page numbers to display (show up to 10 pages around current page)
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

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
            {/* Search and Column Visibility Controls */}
            <div className="flex items-center justify-between gap-4">
                {filterableColumns.length > 0 && searchColumnInstance && (
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchColumnInstance.getFilterValue() ?? ''}
                        onChange={(event) =>
                            searchColumnInstance.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                )}

                {showColumnVisibility && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                <MoreHorizontal className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="bg-neutral-100"
                                    >
                                        <div className="flex items-center justify-between">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {header.column.getCanSort() && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Filter className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleSort(header.column.id, 'asc')}>
                                                            <ArrowUp className="mr-2 h-4 w-4" />
                                                            Sort Ascending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSort(header.column.id, 'desc')}>
                                                            <ArrowDown className="mr-2 h-4 w-4" />
                                                            Sort Descending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <div className="relative px-2 py-1">
                                                            <div className="flex items-center">
                                                                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder={`Search ${header.column.id}`}
                                                                    value={columnSearch[header.column.id] || ''}
                                                                    onChange={(e) => handleColumnSearch(header.column.id, e.target.value)}
                                                                    className="pl-8 h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {/* Server-side Pagination */}
            {showPagination && totalCount > 0 && (
                <div className="flex items-center justify-end gap-x-4 px-2">
                    <div className="flex items-center gap-4">
                        {/* Rows per page selector */}
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
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

                        {/* Results info */}
                        <div className="text-sm font-medium">
                            {/* Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{" "}
                            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results */}
                            Page {currentPage} of {totalCount}
                        </div>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center space-x-2">
                        {/* Previous button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center space-x-1">
                            {getVisiblePages().map((page, index) => {
                                if (page === '...') {
                                    return (
                                        <span key={`dots-${index}`} className="px-2 py-1 text-sm">
                                            ...
                                        </span>
                                    );
                                }

                                return (
                                    <Button
                                        key={page}
                                        // variant={currentPage === page ? "teritary" : "outline"}
                                        variant='teritary'
                                        size="sm"
                                        className="h-8 w-8 p-0"
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
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommonDynamicTable;