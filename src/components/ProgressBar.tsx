import { useEffect, useState } from "react";

export function ProgressBar({ isLoading }: { isLoading: boolean }) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(30); // پر شدن سریع اولیه برای حس پاسخگویی سریع (UI responsiveness)

            const timer1 = setTimeout(() => setProgress(70), 200);
            const timer2 = setTimeout(() => setProgress(85), 500);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else {
            setProgress(100);
            const hideTimer = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 300); // محو شدن نرم پس از تکمیل

            return () => clearTimeout(hideTimer);
        }
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden pointer-events-none z-20">
            <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
