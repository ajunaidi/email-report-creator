import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ReportData } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface ReportDocument {
  id: string;
  userId: string;
  reportTitle: string;
  datePeriod: string;
  data: ReportData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const IMAGE_KEYS = [
  'growthChartImage',
  'distributionChartImage',
  'sentOpensChartImage',
  'funnelChartImage',
  'engagementTrendChartImage',
  'clientLogo'
] as const;

export const saveReport = async (reportId: string | null, data: ReportData) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const userId = auth.currentUser.uid;
  
  // Extract images to subcollection if they are large correctly
  const imagesToSave: Record<string, string> = {};
  const cleanedData = { ...data };

  IMAGE_KEYS.forEach(key => {
    const val = cleanedData[key];
    if (val && typeof val === 'string' && val.startsWith('data:image')) {
      imagesToSave[key] = val;
      // Use a marker so we know it's stored in DB
      (cleanedData as any)[key] = `__DB_ASSET:${key}__`;
    }
  });

  const reportData = {
    userId,
    reportTitle: data.reportTitle,
    datePeriod: data.datePeriod,
    data: cleanedData,
    updatedAt: serverTimestamp(),
  };

  let id = reportId;

  const path = reportId ? `reports/${reportId}` : 'reports';
  try {
    if (id) {
      const reportRef = doc(db, 'reports', id);
      await setDoc(reportRef, reportData, { merge: true });
    } else {
      const reportsRef = collection(db, 'reports');
      const docRef = await addDoc(reportsRef, {
        ...reportData,
        createdAt: serverTimestamp(),
      });
      id = docRef.id;
    }

    // Save assets
    if (id && Object.keys(imagesToSave).length > 0) {
      const batch = writeBatch(db);
      for (const [key, value] of Object.entries(imagesToSave)) {
        const assetRef = doc(db, 'reports', id, 'assets', key);
        batch.set(assetRef, { data: value, updatedAt: serverTimestamp() });
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, id ? OperationType.WRITE : OperationType.CREATE, path);
  }

  return id;
};

export const getReport = async (reportId: string): Promise<ReportDocument | null> => {
  const path = `reports/${reportId}`;
  try {
    const docRef = doc(db, 'reports', reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const reportDoc = { id: docSnap.id, ...docSnap.data() } as ReportDocument;
      
      // Fetch assets
      const assetsRef = collection(db, 'reports', reportId, 'assets');
      const assetsSnap = await getDocs(assetsRef);
      
      assetsSnap.forEach(assetDoc => {
        const key = assetDoc.id;
        const assetData = assetDoc.data();
        if (assetData.data) {
          (reportDoc.data as any)[key] = assetData.data;
        }
      });

      return reportDoc;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
};

export const getUserReports = async () => {
  if (!auth.currentUser) return [];
  
  const userId = auth.currentUser.uid;
  const path = 'reports';
  try {
    const q = query(collection(db, 'reports'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ReportDocument[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const deleteReport = async (reportId: string) => {
  const path = `reports/${reportId}`;
  try {
    // Delete document
    const reportRef = doc(db, 'reports', reportId);
    await deleteDoc(reportRef);
    
    // Attempt to delete assets (best effort, strictly we should use cloud functions or recursive delete)
    // but we'll try to delete identifiable ones if we had a list. 
    // Since we don't have a list here, we'll just delete the parent.
    // The rules allow deletion if owner.
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};
