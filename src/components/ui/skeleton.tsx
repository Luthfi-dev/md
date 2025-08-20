
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary relative overflow-hidden", className)}
      {...props}
    >
        <div className="shimmer-overlay" />
        <style jsx>{`
            .shimmer-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    transparent 25%,
                    rgba(255, 255, 255, 0.08) 50%,
                    transparent 75%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            .dark .shimmer-overlay {
                 background: linear-gradient(
                    90deg,
                    transparent 25%,
                    rgba(255, 255, 255, 0.04) 50%,
                    transparent 75%
                );
            }
            @keyframes shimmer {
                0% {
                    background-position: 200% 0;
                }
                100% {
                    background-position: -200% 0;
                }
            }
        `}</style>
    </div>
  )
}

export { Skeleton }
