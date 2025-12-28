import React from "react";
import Loader from "./Loader";

type LoaderGateProps = {
  loading: boolean;
  children: React.ReactNode;
  fullscreen?: boolean;
  text?: string;
  overlay?: boolean;
  fallback?: React.ReactNode;
  className?: string;
};

export default function LoaderGate({
  loading,
  children,
  fullscreen = false,
  text,
  overlay = true,
  fallback,
  className = "",
}: LoaderGateProps) {
  if (loading) {
    return (
      (fallback as React.ReactElement) || (
        <Loader fullScreen={fullscreen} overlay={overlay} text={text} className={className} />
      )
    );
  }
  return <>{children}</>;
}