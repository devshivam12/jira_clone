import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Generic breadcrumb bar used across the app. Give it an ordered list of crumbs.
// The last crumb is treated as the current page (plain text); the rest render as
// links when they carry a `to`.
//
// items: [{ key, label, to?, icon? }]
//   - key   : stable react key (falls back to the index)
//   - label : text to show
//   - to    : optional route; omit on the current page
//   - icon  : optional lucide icon component shown before the label
const AppBreadcrumb = ({ items = [], className }) => {
    if (!items.length) return null;

    return (
        <div className={cn('flex-none flex items-center h-11 px-6 border-b border-neutral-200 bg-white', className)}>
            <Breadcrumb>
                <BreadcrumbList>
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const Icon = item.icon;
                        const inner = (
                            <>
                                {Icon && <Icon size={14} className="mr-1.5" />}
                                {item.label}
                            </>
                        );

                        return (
                            <React.Fragment key={item.key ?? index}>
                                <BreadcrumbItem>
                                    {isLast || !item.to ? (
                                        <BreadcrumbPage className="font-medium text-neutral-700 flex items-center">
                                            {inner}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link
                                                to={item.to}
                                                className="flex items-center text-neutral-500 hover:text-neutral-800 transition-colors"
                                            >
                                                {inner}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
};

export default AppBreadcrumb;
