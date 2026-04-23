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
  Timestamp
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

export const saveReport = async (reportId: string | null, data: ReportData) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const userId = auth.currentUser.uid;
  const reportData = {
    userId,
    reportTitle: data.reportTitle,
    datePeriod: data.datePeriod,
    data: data,
    updatedAt: serverTimestamp(),
  };

  if (reportId) {
    const reportRef = doc(db, 'reports', reportId);
    await setDoc(reportRef, reportData, { merge: true });
    return reportId;
  } else {
    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, {
      ...reportData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
};

export const getReport = async (reportId: string): Promise<ReportDocument | null> => {
  const docRef = doc(db, 'reports', reportId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ReportDocument;
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
