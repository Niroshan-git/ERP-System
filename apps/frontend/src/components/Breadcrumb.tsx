import Link from "next/link";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-2 flex items-center gap-1.5 text-xs text-graphite-500">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          {index > 0 && <span className="text-graphite-500/50">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-signal hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? "font-medium text-graphite-900" : undefined}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
