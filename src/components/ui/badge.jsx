
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        competition: "border-transparent bg-red-200 text-red-800",
        loisir: "border-transparent bg-blue-200 text-blue-800",
        bloc: "border-transparent bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100",
        difficulte: "border-transparent bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100",
        vitesse: "border-transparent bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-100",
        perf: "border-transparent bg-yellow-200 text-yellow-800",
        autonomes: "border-transparent bg-blue-200 text-blue-800",
        game: "border-transparent bg-purple-200 text-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
