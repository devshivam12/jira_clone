import React, { useEffect, useMemo, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuLabel } from "@/components/ui/dropdown-menu"



import { DottedSeparator } from '@/components/dotted-separator';

import {

    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import TooltipWrapper from '../common/TooltipWrapper';
import { useProjectData } from '@/hooks/useProjectData';

const SprintManagementTwo = () => {
    const { currentProject, templateData } = useProjectData()

    const colorMapping = useMemo(() => {
        if (!templateData?.fields?.work_flow) return {};

        const mapping = {};
        templateData.fields.work_flow.forEach(item => {
            mapping[item.value] = item.color;
        });
        return mapping;
    }, [templateData]);

    const getStatusColor = (status) => {
        return colorMapping[status] 
    };

    console.log("colorMapping", colorMapping)

    const [setColumns, setSetColumns] = useState([
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "status",
            header: "Status",
        },
        {
            id: "empty_column_1",
            header: "Empty Column 1",
            // cell: () => <span>No data</span>, // Static content
        },
        {
            id: "computed_column",
            header: () => (
                <div className="flex items-center gap-4">
                    <span>SCRUM </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const currentDate = new Date().toLocaleDateString();
                            alert(`Date button clicked! Current date: ${currentDate}`);
                            // Add your date handling logic here
                        }}
                    >
                        Add Date
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
        },
        // {
        //     accessorKey: "amount",
        //     header: () => <div className="text-right">Amount</div>,
        //     cell: ({ row }) => {
        //         const amount = parseFloat(row.getValue("amount"))
        //         const formatted = new Intl.NumberFormat("en-US", {
        //             style: "currency",
        //             currency: "USD",
        //         }).format(amount)

        //         return <div className="text-right font-medium">{formatted}</div>
        //     },
        // },
        {
            id: "computed_column",
            header: () => (
                <div className="flex items-center gap-4">
                    <div>
                        <div className="flex gap-x-2">
                            {templateData?.fields?.work_flow?.map((item, index) => (
                                <div key={index} className={`w-6 h-6 flex items-center justify-center text-white text-sm font-light ${item.color} rounded-full shadow-md`}>
                                    {item.value}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const currentDate = new Date().toLocaleDateString();
                                alert(`Date button clicked! Current date: ${currentDate}`);
                                // Add your date handling logic here
                            }}
                        >
                            Complete Sprint
                        </Button>
                    </div>
                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                {/* <Button variant="outline" size="sm"> */}
                                <TooltipWrapper content={'More actions'} className="bg-neutral-600 text-neutral-50">
                                    <div className='flex items-cetner justify-center hover:bg-neutral-50 hover:rounded-md py-1 px-1 cursor-pointer hover:text-accent-foreground'>
                                        <MoreHorizontal className='text-neutral-500 ' />
                                    </div>
                                </TooltipWrapper>
                                {/* </Button> */}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Sprint Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => alert("Edit Sprint clicked")}>
                                    Edit Sprint
                                </DropdownMenuItem>
                                <DottedSeparator />
                                <DropdownMenuItem
                                    onClick={() => confirm("Delete this sprint?") && alert("Deleted!")}
                                    className="text-red-600"
                                >
                                    Delete Sprint
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const payment = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => navigator.clipboard.writeText(payment.id)}
                            >
                                Copy payment ID
                            </DropdownMenuItem>
                            <DottedSeparator />
                            <DropdownMenuItem>View customer</DropdownMenuItem>
                            <DropdownMenuItem>View payment details</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },

    ])

    const [getData, setGetData] = useState([
        {
            id: "728ed52a",
            amount: 120,
            status: "done",
            email: "m@example.com",
        },
        {
            id: "738ed52f",
            amount: 110,
            status: "done",
            email: "m1@example.com",
        },
        {
            id: "721ed52f",
            amount: 200,
            status: "pending",
            email: "ma@example.com",
        },
        {
            id: "728ed12f",
            amount: 100,
            status: "pending",
            email: "m@ex1ample.com",
        },
    ])

    const [sorting, setSorting] = useState([])
    const [columnFilters, setColumnFilters] = useState([])
    const [columnVisibility, setColumnVisibility] = useState({})
    const [rowSelection, setRowSelection] = useState([])

    const table = useReactTable({
        data: getData,
        columns: setColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });
    return (
        <div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter emails..."
                    value={(table.getColumn("email")?.getFilterValue())}
                    onChange={(event) =>
                        table.getColumn("email")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) => column.getCanHide()
                            )
                            .map((column) => {
                                return (
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
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="bg-neutral-200/50 hover:bg-none"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    getData-state={row.getIsSelected() && "selected"}
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
                                <TableCell colSpan={setColumns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SprintManagementTwo
