/**
 * Button Component
 * Reusable button with variants
 */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        outline:
          "border-2 border-primary-300 bg-transparent text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-500",
        secondary:
          "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-500",
        ghost:
          "text-primary-700 hover:bg-primary-100 focus-visible:ring-primary-500",
        link: "text-primary-600 underline-offset-4 hover:underline focus-visible:ring-primary-500",
        success:
          "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || isLoading}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : leftIcon ? (
          <span className="mr-2 inline-flex">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading ? (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        ) : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
