import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-xs font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-98",
  {
    variants: {
      variant: {
        default:
          "bg-brand-main text-white shadow-md shadow-brand-main/20 hover:bg-emerald-900",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border border-emerald-950/15 bg-white text-emerald-950 hover:bg-emerald-950/5 shadow-sm",
        secondary:
          "bg-emerald-950/10 text-emerald-950 hover:bg-emerald-950/15",
        ghost:
          "text-emerald-950 hover:bg-emerald-950/5",
        link:
          "text-emerald-950 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-xl px-3 text-[11px]",
        lg: "h-12 rounded-full px-8 text-xs tracking-widest",
        icon: "h-9 w-9 rounded-xl p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
