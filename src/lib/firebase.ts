import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  writeBatch
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Category, Quotation } from "../types";

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance using the specific databaseId specified in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
export const auth = getAuth(app);

// Collections references
const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
const QUOTATIONS_COLLECTION = "quotations";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
    return categories;
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
 * Save/seed products and categories to Firestore database
 */
export async function seedInitialDataToFirestore(
  products: Product[],
  categories: Category[]
 ): Promise<void> {
  try {
    const batch = writeBatch(db);
 
    // Seed products with default sort_order
    products.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(prod.id));
      batch.set(docRef, { ...prod, sort_order: prod.sort_order ?? index }, { merge: true });
    });
 
    // Seed categories
    for (const cat of categories) {
      const docRef = doc(db, CATEGORIES_COLLECTION, String(cat.id));
      batch.set(docRef, cat, { merge: true });
    }
 
    await batch.commit();
    console.log(`Successfully seeded ${products.length} products and ${categories.length} categories to Firestore.`);
  } catch (error) {
    console.error("Failed to seed data to Firestore:", error);
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

/**
 * Fetch historical quotation orders from Firestore
 */
export async function fetchQuotationsFromFirestore(): Promise<Quotation[]> {
  try {
    const colRef = collection(db, QUOTATIONS_COLLECTION);
    const q = query(colRef, orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(q);
    const quotations: Quotation[] = [];
    snapshot.forEach((docSnap) => {
      quotations.push(docSnap.data() as Quotation);
    });
    return quotations;
  } catch (error) {
    console.error("Failed to fetch quotations from Firestore:", error);
    // Fallback if index not ready
    try {
      const colRef = collection(db, QUOTATIONS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const list: Quotation[] = [];
      snapshot.forEach((docSnap) => list.push(docSnap.data() as Quotation));
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }
}

/**
 * Save a new or updated quotation order to Firestore database
 */
export async function saveQuotationToFirestore(quotation: Quotation): Promise<void> {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quotation.quoteNo);
    await setDoc(docRef, {
      ...quotation,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Quotation ${quotation.quoteNo} saved to Firestore.`);
  } catch (error) {
    console.error("Failed to save quotation to Firestore:", error);
  }
}

/**
 * Delete a quotation record from Firestore
 */
export async function deleteQuotationFromFirestore(quoteNo: string): Promise<void> {
  try {
    const docRef = doc(db, QUOTATIONS_COLLECTION, quoteNo);
    await deleteDoc(docRef);
    console.log(`Quotation ${quoteNo} deleted from Firestore.`);
  } catch (error) {
    console.error("Failed to delete quotation from Firestore:", error);
  }
}
