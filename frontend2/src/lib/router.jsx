"use client";

import NextLink from "next/link";
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import { createContext, useContext } from "react";

const RouteContext = createContext({ params: {}, outlet: null });

export function RouteProvider({ params, outlet, children }) {
    return <RouteContext.Provider value={{ params, outlet }}>{children}</RouteContext.Provider>;
}

export function Outlet() { return useContext(RouteContext).outlet; }
export function useParams() { return useContext(RouteContext).params; }

export function useNavigate() {
    const router = useRouter();
    return (href, options = {}) => {
        if (typeof href === "number") {
            if (href < 0) router.back();
            else router.forward();
        } else if (options.replace) router.replace(href);
        else router.push(href);
    };
}

export function useSearchParams() { return [useNextSearchParams()]; }
export function useLocation() { return { pathname: usePathname() }; }
export function Link({ to, children, ...props }) {
    return <NextLink href={to} {...props}>{children}</NextLink>;
}
