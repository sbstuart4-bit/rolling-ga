import Image from "next/image";
import { MARKETING_PRODUCTS } from "@/components/marketing/marketing-fixtures";
import { ScrollReveal } from "@/components/marketing/visual/scroll-reveal";

export function ProductCardGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MARKETING_PRODUCTS.map((product, index) => (
        <ScrollReveal key={product.name} delay={index * 50}>
          <li className="deck-card group overflow-hidden rounded-2xl border-white/8 bg-[#161618] transition-transform hover:-translate-y-1">
            <div className="relative aspect-square bg-[#0d0d0f]">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80">
                {product.tag}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-medium">{product.name}</p>
            </div>
          </li>
        </ScrollReveal>
      ))}
    </ul>
  );
}
