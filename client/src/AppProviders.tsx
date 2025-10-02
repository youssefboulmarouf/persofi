import React from "react";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <>
            {children}
        </>
    );
};

export default AppProviders;