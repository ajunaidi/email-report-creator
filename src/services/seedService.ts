import { saveReport } from './reportService';
import { MOCK_FULL_DATA } from '../mockData';
import { auth } from '../lib/firebase';

export async function seedInitialData() {
  if (!auth.currentUser) return;
  
  // Create a default report for the user so they have something to see
  const defaultReport = {
    ...MOCK_FULL_DATA,
    reportTitle: "Getting Started with Ajunaidi",
    datePeriod: "Sample Report"
  };
  
  await saveReport(null, defaultReport);
}
