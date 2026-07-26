import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function PageSection({ children, className = "" }: Props) {
  return <section className={`page-shell w-full ${className}`.trim()}>{children}</section>;
}
