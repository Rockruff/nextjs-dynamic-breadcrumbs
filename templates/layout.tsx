import BreadcrumbContent from "./page";

export default function ({
  children,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<typeof BreadcrumbContent>) {
  return (
    <>
      <BreadcrumbContent {...props} />
      {children}
    </>
  );
}
