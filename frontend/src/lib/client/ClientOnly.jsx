import { useEffect, useState } from "react";

export function ClientOnly({ children }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <></>;
    } else {
        return children;
    }
}
