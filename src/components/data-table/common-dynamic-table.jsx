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
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronLeft, ChevronRight, Filter, MoreHorizontal, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DottedSeparator } from '../dotted-separator';
import { Skeleton } from '../ui/skeleton';


const CommonDynamicTable = ({
    data,
    columns,
    defaultColumnVisibility = {},
    searchPlaceholder = "Search...",
    searchColumn = "email",
    // showColumnVisibility = true,
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
    const [openDropdowns, setOpenDropdowns] = useState(false)

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

    const handleSorting = (columnId, direction) => {
        const newSorting = [{ id: columnId, desc: direction === 'desc' }]
        onSortingChange(newSorting)
    }

    // Column filter with search
    const handleColumnSearch = (columnId, value) => {
        setColumnSearch(prev => ({
            ...prev,
            [columnId]: value
        }));
    };

    const handleSearchSubmit = (columnId) => {
        // Create a new search object with only this column's filter
        const newSearch = { [columnId]: columnSearch[columnId] || '' };
        onSearchChange(newSearch);
        onPaginationChange(prev => ({
            ...prev,
            pageIndex: 0
        }));
        setOpenDropdowns(prev => ({
            ...prev,
            [columnId]: false
        }))
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
        onPaginationChange(prev => ({
            ...prev,
            pageIndex: 0
        }));
        setOpenDropdowns(prev => ({
            ...prev,
            [columnId]: false
        }))
    };

    // const handleDropdownOpenChange = (columnId, isOpen) => {
    //     setOpenDropdowns(prev => ({
    //         ...prev,
    //         [columnId]: isOpen
    //     }));
    // };

    // Get all filterable columns
    // const filterableColumns = useMemo(() => {
    //     return columns.filter(column => column.enableFiltering !== false);
    // }, [columns]);

    // Safely get the search column
    // const searchColumnInstance = table.getColumn(searchColumn);

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
    console.log("isLoading", isLoading)
    return (
        <div className="space-y-4">
            {/* Search and Column Visibility Controls */}
            {/* <div className="flex items-center justify-between gap-4">
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
            </div> */}

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
                                            {header.column.columnDef.enableFiltering && (
                                                <DropdownMenu
                                                    open={openDropdowns[header.column.id] || false}
                                                    onOpenChange={(isOpen) => setOpenDropdowns(prev => ({
                                                        ...prev,
                                                        [header.column.id]: isOpen
                                                    }))}
                                                >
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Filter className="h-4 w-4" />
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

                                                        <div className="relative px-2 py-1">
                                                            <div className="flex items-center">
                                                                <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder={`Search ${header.column.columnDef.header}`}
                                                                    className="pl-8 h-8"
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
                                                            <div className='float-right flex items-center gap-x-2 mt-2'>

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
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>


                    <TableBody>
                        {isLoading ? (
                            // Show loading skeletons when isLoading is true
                            Array.from({ length: totalCount > 10 ? pageSize : 5 }).map((_, index) => (
                                <TableRow key={`skeleton-${index}`}>
                                    {table.getVisibleLeafColumns().map(column => (
                                        <TableCell key={`skeleton-${column.id}-${index}`}>
                                            <Skeleton className="h-8 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            // Show actual data when not loading and data exists
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            // Show empty state when no data and not loading
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