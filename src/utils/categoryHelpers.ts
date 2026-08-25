import { Category, Product } from "../types";

export function getProductCategories(product: Product, categories: Category[]) {
  return product.categories
    .map((productCategory) => categories.find((category) => category.id === productCategory.id))
    .filter((category): category is Category => Boolean(category));
}

export function getProductCategoryNames(product: Product, categories: Category[]) {
  return getProductCategories(product, categories).map((category) => category.name);
}
