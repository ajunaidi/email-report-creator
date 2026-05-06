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
  type: 'image' | 'shape' | 'icon' | 'text' | 'chart';
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
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  padding?: number;
  borderRadius?: number;
  strokeWidth?: number;
  shadow?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  textShadow?: string;
  outlineColor?: string;
  outlineWidth?: number;
}

export interface ReportData {
  reportTitle: string;
  pageSize: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'custom';
  orientation: 'portrait' | 'landscape';
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
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

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

  sections: { id: string, type: 'cover' | 'overview' | 'goals' | 'growth' | 'deals' | 'metrics' | 'trends' | 'funnel' | 'table' | 'footer' | 'metrics_overview' | 'report_main' | 'distribution' | 'engagement' | 'grid_metrics' | 'trends_opens' | 'performance' | 'thanks', bgImage?: string }[];
}
