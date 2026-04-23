export interface DealSource {
  id: string;
  source: string;
  value: number;
}

export interface AccountContact {
  id: string;
  name: string;
  contacts: number;
  deals: number;
}

export interface CampaignPerformanceRow {
  id: string;
  name: string;
  date: string;
  sent: number;
  opens: number;
  openRate: number;
  uniqueOpens: number;
  uniqueOpenRate: number;
  linkClicks: number;
  linkClickRate: number;
  uniqueClicks: number;
  uniqueClickRate: number;
  hardBounces: number;
  softBounces: number;
}

export interface ReportData {
  reportTitle: string;
  datePeriod: string;
  tags: string[];
  
  // Row 1
  dealsGoal: number;
  dealsCount: number;
  conversionGoal: number;
  conversionCount: number;
  listContacts: number;
  listDeals: number;
  
  // Summary/Recs
  summary: string;
  recommendations: string[];
  
  // Row 3
  contactCount: number;
  dealCount: number;
  dealsValue: number;
  
  // Row 4 (Line Chart 1)
  growthLabels: string[];
  growthDeals: number[];
  growthContacts: number[];
  
  // Row 5
  dealSources: DealSource[];
  
  // Row 6
  accountContacts: AccountContact[];
  
  // Row 7
  emailsSentGoal: number;
  emailsOpenedGoal: number;
  linkClicksGoal: number;
  actualSent: number;
  actualOpens: number;
  actualClicks: number;
  actualReplies: number;
  
  // Row 8/9/10/11/12
  metricsEmailsSent: number;
  metricsOpens: number;
  metricsOpenRate: string;
  sentTrend: number[];
  opensTrend: number[];
  linkClicksTotal: number;
  linkClickRateStr: string;
  funnelSent: number;
  funnelOpened: number;
  funnelClicked: number;
  engagementOpensTrend: number[];
  engagementClicksTrend: number[];
  unsubscribes: number;
  unsubscribeRateStr: string;
  repliesTotal: number;
  
  // Huge Summary Table
  campaignsPerformance: CampaignPerformanceRow[];

  // Customization
  clientLogo?: string;
  themeColor: string; // Background color
  accentColor: string;
  cardColor: string;
  textColor: string;
  h1Color: string;
  h2Color: string;
  h3Color: string;
  descColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
