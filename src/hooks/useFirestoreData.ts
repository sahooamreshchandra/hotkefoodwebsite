import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, orderBy, OrderByDirection } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface UseFirestoreDataOptions {
    orderByField?: string;
    orderDirection?: OrderByDirection;
}

interface UseFirestoreDataResult<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

/**
 * Fetches data from Firestore using one-time getDocs calls.
 * Tries collection name variants sequentially and stops at the first that returns data.
 * Deduplicates results by document ID.
 */
export function useFirestoreData<T extends { id: string }>(
    collectionNames: string[],
    options?: UseFirestoreDataOptions
): UseFirestoreDataResult<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const allDocs = new Map<string, T>();

        for (const name of collectionNames) {
            try {
                const colRef = collection(db, name);
                const q = options?.orderByField
                    ? query(colRef, orderBy(options.orderByField, options.orderDirection || "asc"))
                    : query(colRef);

                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    snapshot.docs.forEach((doc) => {
                        if (!allDocs.has(doc.id)) {
                            allDocs.set(doc.id, { id: doc.id, ...doc.data() } as T);
                        }
                    });
                    // Found data — no need to try remaining variants
                    break;
                }
            } catch (err) {
                // Collection might not exist, try next variant
                console.warn(`[useFirestoreData] Failed to fetch "${name}":`, err);
            }
        }

        if (mountedRef.current) {
            setData(Array.from(allDocs.values()));
            setLoading(false);
        }
    }, [collectionNames.join(","), options?.orderByField, options?.orderDirection]);

    useEffect(() => {
        mountedRef.current = true;
        fetchData();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchData]);

    return { data, loading, error, refresh: fetchData };
}
