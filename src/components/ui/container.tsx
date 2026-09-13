import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

type ContainerProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Component = as || "div";
  return (
    <Component
      className={cn("mx-auto w-full max-w-[1440px] px-6 sm:px-8 lg:px-12", className)}
      {...props}
    />
  );
}
