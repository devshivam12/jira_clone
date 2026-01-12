import React from 'react';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import TooltipWrapper from './TooltipWrapper';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { DottedSeparator } from '../dotted-separator';
import { Skeleton } from '../ui/skeleton';


const CommonDropdownMenu = ({
  items = [],
  onItemSelect,
  triggerIcon = <MoreHorizontal className="w-4 h-4 text-neutral-500" />,
  triggerTooltip = "More actions",
  align = "end",
  sideOffset = 13,
  isLoading = false,
  onOpenChange,
  className = "",
}) => {
  const renderMenuItem = (item, index) => {
    // Handle separator
    if (item.type === 'separator') {
      return (
        <DottedSeparator
          key={`separator-${index}`}
          className="h-px my-1 bg-neutral-200"
        />
      );
    }

    // Handle submenu
    if (item.type === 'submenu') {
      return (
        <DropdownMenuSub key={item.id || index}>
          <DropdownMenuSubTrigger className="flex justify-between items-center px-3 py-2 cursor-pointer text-neutral-500 hover:bg-neutral-100 rounded-md">
            {item.icon && <span className="mr-2">{item.icon}</span>}
            <span className="font-medium">{item.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 p-1 rounded-md shadow-lg border">
            {item.items?.map((subItem, subIndex) => (
              <React.Fragment key={subItem.id || subIndex}>
                {subItem.type === 'separator' ? (
                  <DottedSeparator className="h-px my-1 bg-neutral-200" />
                ) : (
                  <DropdownMenuItem
                    className={`px-3 py-2 cursor-pointer hover:bg-neutral-100 rounded-md ${subItem.className || ''}`}
                    onSelect={() => {
                      onItemSelect?.(subItem);
                      subItem.onSelect?.();
                    }}
                  >
                    {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                    {subItem.label}
                  </DropdownMenuItem>
                )}
              </React.Fragment>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }

    // Handle regular menu item
    return (
      <DropdownMenuItem
        key={item.id || index}
        className={`gap-2 py-3 px-3 cursor-pointer ${item.className || ''} ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        onSelect={() => {
          if (!item.disabled) {
            onItemSelect?.(item);
            item.onSelect?.();
          }
        }}
      >
        {item.icon && <span className="mr-2">{item.icon}</span>}
        <span className={`font-medium ${item.danger ? 'text-red-500' : 'text-neutral-500'}`}>
          {item.label}
        </span>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <TooltipWrapper content={triggerTooltip} disableFocusListener>
            {triggerIcon}
          </TooltipWrapper>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className={`min-w-44 rounded-sm ${className}`}
        align={align}
        sideOffset={sideOffset}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
        ) : (
          items.map((item, index) => renderMenuItem(item, index))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CommonDropdownMenu;