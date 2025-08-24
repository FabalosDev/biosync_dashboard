import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export const useContentManagement = () => {
  const { toast } = useToast();
  const [contentData, setContentData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [journalsData, setJournalsData] = useState([]);
  const [rssData, setRssData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [approvedData, setApprovedData] = useState([]);
  const [publishedData, setPublishedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
    pendingBreakdown: {
      no: 0,
      regenerated: 0,
      pendingApproval: 0,
      empty: 0
    }
  });

  const [trackingStats, setTrackingStats] = useState({
    approved: 0,
    sentForRegeneration: 0,
    pendingApproval: 0,
    published: 0
  });

  const [buttonStates, setButtonStates] = useState<{[key: string]: { status: 'approved' | 'rejected' | null, timestamp: number }}>({});

  const CONTENT_SHEET_ID = "1C1fnywWU1RMUQ4UmoKBurT7pI7WaffX2pn-6T45wVtY";
  const NEWS_SHEET_ID = "1iSxzNxIuG6JmiPVLxRZF376gJD3U6xe7fB8dNrzc7fw";
  const JOURNALS_SHEET_ID = "1TeZhjan2E8HVGuNomh7BfTm5csghIS1ygr0QHKtaKA4";
  const RSS_SHEET_ID = "1YiEnWas3sHs3CIaMCVDnxoE8cU5xBQO2OLX-UEArppI";

  const CONTENT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONTENT_SHEET_ID}/gviz/tq?tqx=out:json&sheet=text/image`;
  const NEWS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${NEWS_SHEET_ID}/gviz/tq?tqx=out:json`;
  const JOURNALS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${JOURNALS_SHEET_ID}/gviz/tq?tqx=out:json`;
  const RSS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${RSS_SHEET_ID}/gviz/tq?tqx=out:json`;

  // Helper functions
  const createItemKey = (item: any) => {
    return `${item.sheet}-${item.rowNumber || item.row}-${item.id}`;
  };

  const isItemProcessed = (item: any) => {
    const itemKey = createItemKey(item);
    return buttonStates[itemKey]?.status !== null && buttonStates[itemKey]?.status !== undefined;
  };

  // Updated filter function to show content based on column H status
  const filterUnprocessedItems = (data: any[], contentType: string) => {
    console.log(`🔍 Filtering ${contentType} data:`, data.length, 'total items');
    
    const filtered = data.filter(item => {
      // Check if the item is already processed by user action
      if (isItemProcessed(item)) {
        console.log(`⏭️ Item already processed:`, item.id);
        return false;
      }
      
      // Show items based on content type
      if (contentType === 'content') {
        // Show items that need review: NO, REGENERATED, PENDING APPROVAL, PENDING REVIEW, or empty
        const columnHValue = item.columnHStatus?.toLowerCase?.() || '';
        const isPending = columnHValue === 'no' || 
                         columnHValue === 'regenerated' || 
                         columnHValue === 'pending approval' || 
                         columnHValue === 'pending review' ||
                         columnHValue === 'pending' ||
                         columnHValue === '';
        console.log(`📋 Content item ${item.id}: columnH="${item.columnHStatus}", isPending=${isPending}`);
        return isPending;
      } else if (contentType === 'news') {
        const isEmpty = !item.proceedToProduction || item.proceedToProduction === '';
        console.log(`📰 News item ${item.id}: proceedToProduction="${item.proceedToProduction}", isEmpty=${isEmpty}`);
        return isEmpty;
      } else if (contentType === 'journals') {
        const isEmpty = !item.proceedToProduction || item.proceedToProduction === '';
        console.log(`📚 Journal item ${item.id}: proceedToProduction="${item.proceedToProduction}", isEmpty=${isEmpty}`);
        return isEmpty;
      } else if (contentType === 'rss') {
        const isEmpty = !item.proceedToProduction || item.proceedToProduction === '';
        console.log(`📡 RSS item ${item.id}: proceedToProduction="${item.proceedToProduction}", isEmpty=${isEmpty}`);
        return isEmpty;
      }
      
      return true;
    });
    
    console.log(`✅ Filtered ${contentType}: ${filtered.length} items remaining`);
    return filtered;
  };

  // Update dashboard stats to include all content types
  const updateDashboardStats = () => {
    let totalCount = 0;
    let approvedCount = 0;
    let publishedCount = 0;
    let noCount = 0;
    let regeneratedCount = 0;
    let pendingApprovalCount = 0;
    let emptyCount = 0;

    // Count content data - only count rows that have data in column C (caption)
    contentData.forEach((item: any) => {
      // Only count if column C (caption) has data
      if (item.caption && item.caption.trim() !== '') {
        totalCount++;
        const columnHValue = item.columnHStatus;
        const columnHLower = columnHValue?.toLowerCase?.() || '';
        
        if (columnHValue === "YES") {
          approvedCount++;
        } else if (columnHValue && (
          columnHValue.match(/^\d{17}$/) || // 17-digit numbers like 18143252281397147
          columnHValue.startsWith('urn:li:share:') // LinkedIn URN shares
        )) {
          publishedCount++;
        } else {
          // Count pending breakdown
          if (columnHLower === 'no') {
            noCount++;
          } else if (columnHLower === 'regenerated') {
            regeneratedCount++;
          } else if (columnHLower === 'pending approval' || columnHLower === 'pending review' || columnHLower === 'pending') {
            pendingApprovalCount++;
          } else if (columnHLower === '') {
            emptyCount++;
          }
        }
      }
    });

    // Don't count news, journals, or RSS data in the main dashboard stats
    // Only content data should be counted for the main dashboard
    
    // Note: News, journals, and RSS data are not included in main dashboard counts
    // as per user requirements - only content data with column C data should be counted

    // Calculate pending count - items that are truly pending (not processed)
    // Exclude approved (YES), rejected (NO), regenerated, and published items
    const pendingCount = totalCount - publishedCount - approvedCount - noCount - regeneratedCount;

    setDashboardStats({
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      published: publishedCount,
      pendingBreakdown: {
        no: noCount,
        regenerated: regeneratedCount,
        pendingApproval: pendingApprovalCount,
        empty: emptyCount
      }
    });

    // Update tracking stats as well - use column H for content items
    let sentForRegenerationCount = 0;
    contentData.forEach((item: any) => {
      if (item.caption && item.caption.trim() !== '') { // Only count items with data in column C
        const columnHValue = item.columnHStatus?.toLowerCase?.() || '';
        if (columnHValue === "no" || columnHValue === "regenerated") {
          sentForRegenerationCount++;
        }
      }
    });

    setTrackingStats({
      approved: approvedCount,
      sentForRegeneration: sentForRegenerationCount,
      pendingApproval: pendingCount,
      published: publishedCount
    });
  };

  // Delete content handler
  const handleDeleteContent = async (item: any) => {
    try {
      const itemKey = createItemKey(item);
      setButtonStates(prev => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
      
      toast({
        title: "Content Deleted",
        description: "Content has been removed from your local view",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  // Approval handlers
  const handleContentApproval = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'approved', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleContentRejection = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'rejected', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleNewsApproval = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'approved', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleNewsRejection = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'rejected', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleJournalApproval = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'approved', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleJournalRejection = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'rejected', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleRssApproval = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'approved', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleRssRejection = async (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => ({ 
      ...prev, 
      [itemKey]: { 
        status: 'rejected', 
        timestamp: new Date().getTime() 
      } 
    }));
  };

  const handleUndo = (item: any) => {
    const itemKey = createItemKey(item);
    setButtonStates(prev => {
      const newState = { ...prev };
      delete newState[itemKey];
      return newState;
    });
  };

  const getButtonState = (item: any): 'approved' | 'rejected' | null => {
    const itemKey = createItemKey(item);
    return buttonStates[itemKey]?.status || null;
  };

  // Simplified data fetching functions without debouncing
  const fetchContentData = async () => {
    try {
      console.log('📡 Fetching content data...');
      const response = await fetch(CONTENT_SHEET_URL);
      const text = await response.text();
      const json = JSON.parse(text.substr(47).slice(0, -2));
      
      const rows = json.table.rows.map((row: any, index: number) => ({
        id: `content-${index}`,
        rowNumber: index + 2,
        inputText: row.c[0]?.v || "", // Column A - INPUT TEXT (contains links)
        imageGenerated: row.c[5]?.v || "",
        headline: row.c[1]?.v || "",
        caption: row.c[2]?.v || "",
        approval: row.c[3]?.v || "", // Column D - this is the approval status
        feedback: row.c[4]?.v || "",
        imageQuery: row.c[6]?.v || "",
        columnHStatus: row.c[7]?.v || "", // Column H - this is what we check for "pending approval"
        regeneratedImage: row.c[11]?.v || "",
        status: row.c[3]?.v === "YES" ? "Approved" : row.c[3]?.v === "NO" ? "Rejected" : "Pending",
        timestamp: new Date().getTime() - index * 1000,
        sheet: "text/image"
      })).reverse();
      
      console.log('✅ Content data fetched:', rows.length, 'items');
      console.log('📋 Sample content items:', rows.slice(0, 3).map(r => ({ id: r.id, columnHStatus: r.columnHStatus })));
      
      setContentData(rows);
      
      const approved = rows.filter(item => item.columnHStatus === "YES");
      const published = rows.filter(item => item.columnHStatus && item.columnHStatus.match(/^\d{17}$/));
      
      setApprovedData(approved);
      setPublishedData(published);
    } catch (error) {
      console.error("❌ Error fetching content data:", error);
    }
  };

  const fetchNewsData = async () => {
    try {
      const response = await fetch(NEWS_SHEET_URL);
      const text = await response.text();
      const json = JSON.parse(text.substr(47).slice(0, -2));
      
      const totalRows = json.table.rows.length;
      const allRows = json.table.rows.map((row: any, index: number) => {
        const actualRowNumber = totalRows - index + 1;
        return {
          id: `news-${index}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: index,
          title: row.c[0]?.v || "",
          articleText: row.c[2]?.v || "",
          articleAuthors: row.c[3]?.v || "",
          source: row.c[4]?.v || "",
          proceedToProduction: row.c[5]?.v || "",
          status: row.c[5]?.v === "YES" ? "Approved" : row.c[5]?.v === "NO" ? "Rejected" : "Pending",
          timestamp: new Date().getTime() - index * 1000,
          sheet: "news api"
        };
      });
      
      const latest100 = allRows.slice(-100).reverse();
      
      setNewsData(latest100);
    } catch (error) {
      console.error("Error fetching news data:", error);
    }
  };

  const fetchJournalsData = async () => {
    try {
      const response = await fetch(JOURNALS_SHEET_URL);
      const text = await response.text();
      const json = JSON.parse(text.substr(47).slice(0, -2));
      
      const totalRows = json.table.rows.length;
      const allRows = json.table.rows.map((row: any, index: number) => {
        const actualRowNumber = totalRows - index + 1;
        return {
          id: `journal-${index}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: index,
          articleTitle: row.c[0]?.v || "",
          articleAuthors: row.c[1]?.v || "",
          articleText: row.c[3]?.v || "",
          proceedToProduction: row.c[4]?.v || "",
          status: row.c[4]?.v === "YES" ? "Approved" : row.c[4]?.v === "NO" ? "Rejected" : "Pending",
          timestamp: new Date().getTime() - index * 1000,
          sheet: "journals"
        };
      });
      
      const latest100 = allRows.slice(-100).reverse();
      
      setJournalsData(latest100);
    } catch (error) {
      console.error("Error fetching journals data:", error);
    }
  };

  const fetchRssData = async () => {
    try {
      console.log('🔄 Fetching RSS data from:', RSS_SHEET_URL);
      const response = await fetch(RSS_SHEET_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log('📋 RSS raw text length:', text.length);
      
      if (text.length < 50) {
        console.warn('⚠️ RSS response too short:', text);
        setRssData([]);
        return;
      }
      
      const json = JSON.parse(text.substr(47).slice(0, -2));
      console.log('📊 RSS JSON parsed:', json.table?.rows?.length || 0, 'rows');
      
      if (!json.table?.rows) {
        console.warn('⚠️ No RSS table data found');
        setRssData([]);
        return;
      }
      
      const totalRows = json.table.rows.length;
      const allRows = json.table.rows.map((row: any, index: number) => {
        const actualRowNumber = totalRows - index + 1;
        return {
          id: `rss-${index}`,
          rowNumber: actualRowNumber,
          actualArrayIndex: index,
          title: row.c[4]?.v || "",           // Column E: title
          contentSnippet: row.c[0]?.v || "", // Column A: contentSnippet
          source: row.c[3]?.v || "",         // Column D: source
          link: row.c[5]?.v || "",           // Column F: link
          creator: row.c[1]?.v || "",        // Column B: creator
          date: row.c[2]?.v || "",           // Column C: date
          proceedToProduction: row.c[14]?.v || "", // Column O: "Proceed to production"
          status: row.c[14]?.v === "YES" ? "Approved" : row.c[14]?.v === "NO" ? "Rejected" : "Pending",
          timestamp: new Date().getTime() - index * 1000,
          sheet: "RSS"
        };
      });
      
      const latest100 = allRows.slice(-100).reverse();
      console.log('✅ RSS data processed:', latest100.length, 'items');
      
      setRssData(latest100);
    } catch (error) {
      console.error("❌ Error fetching RSS data:", error);
      setRssData([]);
    }
  };

  const fetchTimelineData = async () => {
    try {
      const response = await fetch("https://biohackyourself.app.n8n.cloud/webhook-test/approvalschedule");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTimelineData(data || []);
    } catch (error) {
      console.error("Error fetching timeline data:", error);
      // Set empty array if fetch fails to prevent breaking other data
      setTimelineData([]);
    }
  };

  // Simplified fetchAllData without debouncing
  const fetchAllData = async () => {
    if (isLoading) {
      console.log('🛑 Data fetch already in progress, skipping...');
      return;
    }

    console.log('🚀 Starting data fetch...');
    setIsLoading(true);
    
    try {
      await Promise.allSettled([
        fetchContentData(),
        fetchNewsData(),
        fetchJournalsData(),
        fetchRssData(),
        fetchTimelineData()
      ]);
      console.log('✅ All data fetched successfully');
    } catch (error) {
      console.error('❌ Error in fetchAllData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update stats whenever data changes
  useEffect(() => {
    updateDashboardStats();
  }, [contentData, newsData, journalsData, rssData, buttonStates]);

  return {
    // Data
    contentData,
    newsData,
    journalsData,
    rssData,
    timelineData,
    approvedData,
    publishedData,
    dashboardStats,
    trackingStats,
    buttonStates,
    setButtonStates,
    
    // Helper functions
    createItemKey,
    isItemProcessed,
    filterUnprocessedItems,
    
    // Action handlers
    handleDeleteContent,
    handleContentApproval,
    handleContentRejection,
    handleNewsApproval,
    handleNewsRejection,
    handleJournalApproval,
    handleJournalRejection,
    handleRssApproval,
    handleRssRejection,
    handleUndo,
    getButtonState,
    
    // Data fetching
    fetchAllData,
    fetchContentData,
    fetchNewsData,
    fetchJournalsData,
    fetchRssData,
    fetchTimelineData,
    isLoading,
  };
};
