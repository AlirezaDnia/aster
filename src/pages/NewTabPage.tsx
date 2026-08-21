import { StartPage } from "./StartPage";

interface NewTabPageProps {
    onNavigate: (url: string) => void;
}

export function NewTabPage({ onNavigate }: NewTabPageProps) {
    return <StartPage onNavigate={onNavigate} />;
}
