import React from "react";

// PUBLIC_INTERFACE
export default function Layout({ children }) {
  /** Layout wrapper: centers content, provides max width and vertical spacing */
  return (
    <div className="ttt-layout">
      {children}
    </div>
  );
}
