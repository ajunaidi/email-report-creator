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

  return id;
};

export const getReport = async (reportId: string): Promise<ReportDocument | null> => {
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
  return null;
};

export const getUserReports = async () => {
  if (!auth.currentUser) return [];
  
  const userId = auth.currentUser.uid;
  const q = query(collection(db, 'reports'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ReportDocument[];
};

export const deleteReport = async (reportId: string) => {
  const reportRef = doc(db, 'reports', reportId);
  await deleteDoc(reportRef);
};
