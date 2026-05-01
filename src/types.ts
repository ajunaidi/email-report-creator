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

export interface HeroStat {
  id: string;
  label: string;
  value: string;
  subLabel: string;
  iconName: string;
}

export interface FloatingElement {
  id: string;
  type: 'image' | 'shape' | 'icon' | 'text';
  content: string; // URL, shape ID, Lucide icon name, or text content
  top: number;
  left: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  opacity?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
}

export interface ReportData {
  reportTitle: string;
  datePeriod: string;
  tags: string[];
  heroStats?: HeroStat[];
  floatingElements?: FloatingElement[];
  
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
  growthChartImage?: string;
  distributionChartImage?: string;
  sentOpensChartImage?: string;
  funnelChartImage?: string;
  engagementTrendChartImage?: string;
  
  clientLogo?: string;
  themeColor: string; // Background color
  accentColor: string;
  cardColor: string;
  textColor: string;
  h1Color: string;
  h2Color: string;
  h3Color: string;
  h4Color?: string;
  descColor: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  // Section Labels & Titles
  overviewTitle?: string;
  campaignName?: string;
  goalsTitle?: string;
  growthTitle?: string;
  growthDistributionTitle?: string;
  dealsValueTitle?: string;
  dealsGoalsTitle?: string;
  campaignEngagementTitle?: string;
  metricsLabels?: string[];
  trendsSentOpensTitle?: string;
  trendsClicksTitle?: string;
  trendsClickRateTitle?: string;
  funnelClicksTitle?: string;
  funnelTrendsTitle?: string;
  performanceTableTitle?: string;
  thanksTitle?: string;
  thanksBody?: string;

  sections: { id: string, type: 'cover' | 'overview' | 'goals' | 'growth' | 'deals' | 'metrics' | 'trends' | 'funnel' | 'table' | 'footer', bgImage?: string }[];
}
