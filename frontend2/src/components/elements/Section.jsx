import "./Section.css";
import { forwardRef } from "react";

export const Section = forwardRef(
    ({ className, children, ...props }, ref) => {
        return (
            <section
                ref={ref}
                className={`m-section ${className ? className : ""}`}
                {...props}
            >
                {children}
            </section>
        );
    },
);
