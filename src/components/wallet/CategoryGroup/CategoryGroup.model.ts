import type { Asset, Category } from "@/lib/models/asset";

export interface CategoryGroupProps {
  category: Category;
  label: string;
  icon: React.ReactNode;
  assets: Asset[];
  count: number;
}
