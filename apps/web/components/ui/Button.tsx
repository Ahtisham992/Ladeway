import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline"
 size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant = "primary", size = "default", ...props }, ref) => {
 return (
 <button
 ref={ref}
 className={cn(
 "inline-flex items-center justify-center rounded-md text-sm font-medium transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
 {
 "bg-primary text-white hover:bg-primary-600": variant === "primary",
 "bg-secondary-100 text-secondary-700 hover:bg-secondary-200": variant === "secondary",
 "bg-error text-white hover:bg-error/90": variant === "destructive",
 "border border-border bg-white hover:bg-surface-alt hover:text-primary": variant === "outline",
 "hover:bg-surface-alt hover:text-primary": variant === "ghost",
 "h-10 px-4 py-2": size === "default",
 "h-9 rounded-md px-3": size === "sm",
 "h-11 px-8 rounded-md": size === "lg",
 "h-10 w-10": size === "icon",
 },
 className
 )}
 {...props}
 />
 )
 }
)
Button.displayName = "Button"

export { Button }
