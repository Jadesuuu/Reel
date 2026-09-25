'use client';

import { Check } from 'lucide-react';
import { DropdownMenu as RadixMenu } from 'radix-ui';
import { cn } from '../../lib/cn';

export const Menu = RadixMenu.Root;
export const MenuTrigger = RadixMenu.Trigger;
export const MenuGroup = RadixMenu.Group;
export const MenuRadioGroup = RadixMenu.RadioGroup;

export function MenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 6,
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}) {
  return (
    <RadixMenu.Portal>
      <RadixMenu.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={8}
        className={cn(
          'reel-pop z-[60] min-w-56 rounded-md border border-line bg-surface-2 p-1 shadow-md',
          className,
        )}
      >
        {children}
      </RadixMenu.Content>
    </RadixMenu.Portal>
  );
}

const itemClass =
  'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2.5 py-2 text-body-sm text-fg outline-none data-[highlighted]:bg-surface-3 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none';

export function MenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof RadixMenu.Item> & { destructive?: boolean }) {
  return (
    <RadixMenu.Item
      className={cn(
        itemClass,
        destructive && 'text-danger data-[highlighted]:bg-danger-soft',
        className,
      )}
      {...props}
    />
  );
}

export function MenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixMenu.RadioItem>) {
  return (
    <RadixMenu.RadioItem className={cn(itemClass, 'pl-7', className)} {...props}>
      <RadixMenu.ItemIndicator className="absolute left-2 inline-flex">
        <Check className="size-4 text-accent" />
      </RadixMenu.ItemIndicator>
      {children}
    </RadixMenu.RadioItem>
  );
}

export function MenuCheckboxItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadixMenu.CheckboxItem>) {
  return (
    <RadixMenu.CheckboxItem className={cn(itemClass, 'pl-7', className)} {...props}>
      <RadixMenu.ItemIndicator className="absolute left-2 inline-flex">
        <Check className="size-4 text-accent" />
      </RadixMenu.ItemIndicator>
      {children}
    </RadixMenu.CheckboxItem>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <RadixMenu.Label className="stamp px-2 pt-2 pb-1 text-faint">{children}</RadixMenu.Label>;
}

export function MenuSeparator() {
  return <RadixMenu.Separator className="my-1 h-px bg-line" />;
}

export function MenuShortcut({ children }: { children: React.ReactNode }) {
  return <span className="ml-auto font-mono text-fine text-faint">{children}</span>;
}
