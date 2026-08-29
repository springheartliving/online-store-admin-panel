import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Category } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the specific databaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Collections references
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
/**
 * Fetch all products from Firestore database
 */
export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const colRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push(docSnap.data() as Product);
    });
    // Sort products by sort_order (ascending). If not defined, fallback to id.
    return products.sort((a, b) => {
      const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
      const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
      return orderA - orderB;
    });
  } catch (error) {
    console.error("Failed to fetch products from Firestore:", error);
    return [];
  }
}

/**
 * Fetch categories from Firestore database
 */
export async function fetchCategoriesFromFirestore(): Promise<Category[]> {
  try {
    const colRef = collection(db, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return [];
    }
    const categories: Category[] = [];
    snapshot.forEach((docSnap) => {
      categories.push(docSnap.data() as Category);
    });
    return categories.sort((a, b) => {
      const orderA = a.sort_order !== undefined ? a.sort_order : a.id;
      const orderB = b.sort_order !== undefined ? b.sort_order : b.id;
      return orderA - orderB;
    });
  } catch (error) {
    console.error("Failed to fetch categories from Firestore:", error);
    return [];
  }
}

/**
 * Save or update a product in Firestore database
 */
export async function saveProductToFirestore(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, String(product.id));
    await setDoc(docRef, product, { merge: true });
    console.log(`Product ${product.id} (${product.name}) saved to Firestore.`);
  } catch (error) {
    console.error(`Failed to save product ${product.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Delete a product from Firestore database
 */
export async function deleteProductFromFirestore(productId: string | number): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, String(productId));
    await deleteDoc(docRef);
    console.log(`Product ${productId} deleted from Firestore.`);
  } catch (error) {
    console.error(`Failed to delete product ${productId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Save or update a category in Firestore database
 */
export async function saveCategoryToFirestore(category: Category): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, String(category.id));
    await setDoc(docRef, category, { merge: true });
    console.log(`Category ${category.id} (${category.name}) saved to Firestore.`);
  } catch (error) {
    console.error(`Failed to save category ${category.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Delete a category from Firestore database
 */
export async function deleteCategoryFromFirestore(categoryId: string | number): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, String(categoryId));
    await deleteDoc(docRef);
    console.log(`Category ${categoryId} deleted from Firestore.`);
  } catch (error) {
    console.error(`Failed to delete category ${categoryId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Save updated product orders to Firestore in a batch write
 */
export async function saveProductsOrderToFirestore(orderedProducts: Product[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orderedProducts.forEach((product, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(product.id));
      batch.set(docRef, { ...product, sort_order: index }, { merge: true });
    });
    await batch.commit();
    console.log(`Successfully saved new sorting order for ${orderedProducts.length} products to Firestore.`);
  } catch (error) {
    console.error("Failed to save product ordering to Firestore:", error);
    throw error;
  }
}
