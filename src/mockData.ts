import { ReportData } from "./types";

export const MOCK_FULL_DATA: ReportData = {
  reportTitle: "Ajunaidi Email Report Builder",
  datePeriod: "03/24/2026 - 04/22/2026",
  tags: ["General Email Marketing", "eCommerce Email Marketing"],
  
  dealsGoal: 10000,
  dealsCount: 1637,
  conversionGoal: 10000,
  conversionCount: 5581,
  
  listContacts: 5734,
  listDeals: 4076,
  
  summary: "Overall, we observed 4,951 contacts and 3,749 total emails sent, leading to 8,855 opens and 414 link clicks. We also recorded 49 deals with a total value of $1,680, alongside 672 replies to our campaigns. Despite these positive engagement metrics, we noted a 68.71% unsubscribe rate and several anomalous negative rates for open and link clicks in campaign performance data, which require further investigation. We are actively monitoring daily fluctuations in contacts and deals, which show significant variability throughout the month.",
  recommendations: [
    "We recommend investigating the -31.76% decline in open rate and the 81.15% unsubscribe rate to identify root causes, potentially by segmenting audiences and A/B testing subject lines or content.",
    "We should analyze campaigns with unusually high bounce rates, such as 'Voluptas non qui aut', with 12,095 hard bounces, to clean contact lists and improve email deliverability.",
    "We propose leveraging the 31.59% link click rate by optimizing calls-to-action and landing page experiences to convert engaged users into deals, especially for top-performing deals like 'Numquam et ut sequi ea', valued at $9,012."
  ],
  
  contactCount: 2871,
  dealCount: 4603,
  dealsValue: 5771,
  
  growthLabels: ['Mar 24', '26', '28', '30', 'Apr 01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21'],
  growthContacts: [4500, 6200, 5800, 4200, 7800, 6100, 5200, 4800, 7200, 9100, 5400, 6800, 4500, 8200, 3100],
  growthDeals: [8200, 7100, 6500, 4800, 5200, 6100, 3200, 2800, 4200, 5100, 7400, 8800, 3500, 4200, 5100],
  
  dealSources: [
    { id: '1', source: 'Porro est in.', value: 9227 },
    { id: '2', source: 'Autem est ex nam aut.', value: 8431 },
    { id: '3', source: 'Et vel illum aut enim.', value: 7485 },
    { id: '4', source: 'Et qui saepe labore.', value: 4366 },
    { id: '5', source: 'Dolor ut velit nulla.', value: 2419 },
    { id: '6', source: 'Adipisci ea ex ad.', value: 1866 },
    { id: '7', source: 'Qui modi aut ratione.', value: 1669 },
    { id: '8', source: 'Et a eaque magnam dolor.', value: 873 },
  ],
  
  accountContacts: [
    { id: 'a1', name: 'Et nihil sapien est id sit.', contacts: 9227, deals: 3226 },
    { id: 'a2', name: 'Labore fuga harum et.', contacts: 7855, deals: 503 },
    { id: 'a3', name: 'Deserunt ut et quae.', contacts: 7744, deals: 7881 },
    { id: 'a4', name: 'Quas est ut natus at ut.', contacts: 7654, deals: 7367 },
  ],
  
  emailsSentGoal: 10000,
  emailsOpenedGoal: 10000,
  linkClicksGoal: 10000,
  actualSent: 6344,
  actualOpens: 5924,
  actualClicks: 8633,
  actualReplies: 9124,
  
  metricsEmailsSent: 2253,
  metricsOpens: 9685,
  metricsOpenRate: "-70.34%",
  
  sentTrend: [2000, 4000, 3000, 5000, 2000, 6000, 4000, 3000, 5500, 4000, 6500, 3000, 4200, 2000, 1000],
  opensTrend: [1500, 3200, 2800, 4100, 1800, 4900, 3100, 2100, 4200, 3400, 5200, 2100, 3200, 1500, 800],
  
  linkClicksTotal: 8303,
  linkClickRateStr: "-10.22%",
  
  funnelSent: 9483,
  funnelOpened: 5979,
  funnelClicked: 3619,
  
  engagementOpensTrend: [1500, 3200, 2800, 4100, 1800, 4900, 3100, 2100, 4200, 3400, 5200, 2100, 3200, 1500, 800],
  engagementClicksTrend: [400, 800, 600, 1200, 500, 1400, 900, 800, 1100, 900, 1300, 700, 900, 400, 200],
  
  unsubscribes: 952,
  unsubscribeRateStr: "369.39%",
  repliesTotal: 7194,
  
  campaignsPerformance: [
    { id: 'cp1', name: 'Nam: Modi et in ad eum.', date: '2026-01-18', sent: 8067, opens: 1530, openRate: -82.76, uniqueOpens: 12740, uniqueOpenRate: 64.43, linkClicks: 13262, linkClickRate: -69.45, uniqueClicks: 4801, uniqueClickRate: -25.12, hardBounces: 16757, softBounces: 13430 },
    { id: 'cp2', name: 'Name: Ea illo in sit quis.', date: '2026-02-28', sent: 7931, opens: 8021, openRate: -47.01, uniqueOpens: 8477, uniqueOpenRate: 1127.11, linkClicks: 4139, linkClickRate: -24.18, uniqueClicks: 5075, uniqueClickRate: -29.61, hardBounces: 8952, softBounces: 8827 },
    { id: 'cp3', name: 'Name: Ad commodi eum et enim.', date: '2026-02-07', sent: 7803, opens: 7324, openRate: -582.43, uniqueOpens: 4019, uniqueOpenRate: 18.56, linkClicks: 3136, linkClickRate: -249.68, uniqueClicks: 5319, uniqueClickRate: -42.34, hardBounces: 6329, softBounces: 940 },
  ],
  themeColor: "#e9b949",
  accentColor: "#dc2626",
  cardColor: "#fffdf5",
  textColor: "#1c1917",
  h1Color: "#1c1917",
  h2Color: "#1c1917",
  h3Color: "#1c1917",
  descColor: "#57534e",
  fontFamily: 'sans',
  borderRadius: '2xl',
  clientLogo: "",
  overviewTitle: "Overview\nMetrics",
  campaignName: "Campaign Name",
  goalsTitle: "Email Marketing Report",
  growthTitle: "Deals and Contacts in Account",
  growthDistributionTitle: "Contacts & Deals distribution",
  dealsValueTitle: "Deals value",
  dealsGoalsTitle: "Deals and Conversion Goals",
  campaignEngagementTitle: "Campaign Engagement List",
  metricsLabels: ["Total Emails Sent", "Opens", "Open Rate", "Contact Count", "Deal Count", "Deals Value", "Contact Count", "Deal Count", "Deals Value"],
  trendsSentOpensTitle: "Sent vs. Opens",
  trendsClicksTitle: "Link clicks",
  trendsClickRateTitle: "Link Click Rate",
  funnelClicksTitle: "Email Clicks funnel",
  funnelTrendsTitle: "Sent/opened emails trends",
  performanceTableTitle: "Campaigns Performance",
  thanksTitle: "Thanks\nyou",
  thanksBody: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, seodo eiusm odtempor incididunt ut labore et dolore magna aliqua. Ut enim asdfd minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  sections: [
    { id: 'sec-1', type: 'cover' },
    { id: 'sec-2', type: 'overview' },
    { id: 'sec-3', type: 'goals' },
    { id: 'sec-4', type: 'growth' },
    { id: 'sec-5', type: 'deals' },
    { id: 'sec-6', type: 'metrics' },
    { id: 'sec-7', type: 'trends' },
    { id: 'sec-8', type: 'funnel' },
    { id: 'sec-9', type: 'table' },
    { id: 'sec-10', type: 'footer' }
  ]
};
