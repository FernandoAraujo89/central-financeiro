"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const Dropdown = DropdownPrimitive.Root;
export const DropdownTrigger = DropdownPrimitive.Trigger;

export function DropdownContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={6}
        align="end"
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg",
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownPrimitive.Item
    ref={ref}
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm text-neutral-700 outline-none data-[highlighted]:bg-neutral-100",
      className
    )}
    {...props}
  />
));
DropdownItem.displayName = "DropdownItem";

export const DropdownSeparator = () => <DropdownPrimitive.Separator className="my-1 h-px bg-neutral-200" />;
export const DropdownLabel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label className={cn("px-2.5 py-1.5 text-xs font-semibold text-neutral-400 uppercase", className)} {...props} />
);
