
"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastOverlay,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

const AnimatedCheckIcon = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 130.2 130.2"
    className="w-16 h-16"
  >
    <circle
      className="path circle"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="6"
      strokeMiterlimit="10"
      cx="65.1"
      cy="65.1"
      r="62.1"
    />
    <polyline
      className="path check"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="6"
      strokeLinecap="round"
      strokeMiterlimit="10"
      points="100.2,40.2 51.5,88.8 29.8,67.5 "
    />
    <style>{`
      .path { stroke-dasharray: 1000; stroke-dashoffset: 0; }
      .circle { animation: 0.9s ease-in-out forwards dash; }
      .check { stroke-dashoffset: -100; animation: 0.9s 0.35s ease-in-out forwards dash-check; }
      @keyframes dash {
        0% { stroke-dashoffset: 1000; }
        100% { stroke-dashoffset: 0; }
      }
      @keyframes dash-check {
        0% { stroke-dashoffset: -100; }
        100% { stroke-dashoffset: 900; }
      }
    `}</style>
  </svg>
);

const AnimatedErrorIcon = () => (
   <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 130.2 130.2"
    className="w-16 h-16"
  >
    <circle
      className="path circle"
      fill="none"
      stroke="hsl(var(--destructive))"
      strokeWidth="6"
      strokeMiterlimit="10"
      cx="65.1"
      cy="65.1"
      r="62.1"
    />
    <line
      className="path line"
      fill="none"
      stroke="hsl(var(--destructive))"
      strokeWidth="6"
      strokeLinecap="round"
      strokeMiterlimit="10"
      x1="34.4"
      y1="37.9"
      x2="95.8"
      y2="92.3"
    />
    <line
      className="path line"
      fill="none"
      stroke="hsl(var(--destructive))"
      strokeWidth="6"
      strokeLinecap="round"
      strokeMiterlimit="10"
      x1="95.8"
      y1="38"
      x2="34.4"
      y2="92.2"
    />
     <style>{`
      .path { stroke-dasharray: 1000; stroke-dashoffset: 0; }
      .circle { animation: 0.9s ease-in-out forwards dash; }
      .line { stroke-dashoffset: 1000; animation: 0.9s 0.35s ease-in-out forwards dash; }
      @keyframes dash {
        0% { stroke-dashoffset: 1000; }
        100% { stroke-dashoffset: 0; }
      }
    `}</style>
  </svg>
);


export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isDestructive = props.variant === 'destructive';
        const Icon = isDestructive ? AnimatedErrorIcon : AnimatedCheckIcon;

        // Use a state to control the overlay visibility
        const [isOverlayVisible, setIsOverlayVisible] = React.useState(props.open);
        
        const handleDismiss = () => {
          setIsOverlayVisible(false);
          dismiss(id);
        }

        React.useEffect(() => {
          setIsOverlayVisible(props.open);
        }, [props.open]);


        return (
          <React.Fragment key={id}>
            {isOverlayVisible && <ToastOverlay onClick={handleDismiss} />}
            <ToastViewport>
              <Toast {...props} className="z-[101]">
                <Icon />
                <div className="grid gap-1">
                  {title && <ToastTitle>{title}</ToastTitle>}
                  {description && (
                    <ToastDescription>{description}</ToastDescription>
                  )}
                </div>
                {action}
                <ToastClose onClick={handleDismiss}/>
              </Toast>
            </ToastViewport>
          </React.Fragment>
        );
      })}
    </ToastProvider>
  )
}
