"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(function TabsList(
  { className, ...props },
  ref
) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex w-full items-center justify-start border-b border-border p-0 text-neutral-500 font-light ",
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(function TabsTrigger(
  { className, ...props },
  ref
) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "mx-2 inline-flex items-center justify-start whitespace-nowrap rounded-md px-2 py-2 mb-1 text-base font-medium transition-all",
        "first-of-type:ml-0 disabled:pointer-events-none disabled:text-neutral-500",
        // Active state
        "data-[state=active]:bg-neutral-100 data-[state=active]:font-semibold data-[state=active]:text-neutral-500",
        // Inactive state with hover effect
        "data-[state=inactive]:hover:bg-neutral-50 data-[state=inactive]:text-neutral-500",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(function TabsContent(
  { className, ...props },
  ref
) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };