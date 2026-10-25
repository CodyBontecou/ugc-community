import type { ComponentProps } from "react";
export default function PublicLink({ prefetch: _prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  void _prefetch;
  return <a {...props} />;
}
