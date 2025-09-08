import { cn } from "@/lib/utils";

interface CardProps {
    className?: string;
    children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-sm",
                className
            )}
        >
            {children}
        </div>
    );
}

interface CardContentProps {
    className?: string;
    children: React.ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
    return <div className={cn("p-6", className)}>{children}</div>;
}
