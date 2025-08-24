import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Share2, 
  Newspaper,
  BookOpen,
  Rss,
  TrendingUp,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { ProgressTracker } from "@/components/ProgressTracker";
import { ContentApprovalCard } from "@/components/ContentApprovalCard";
import { DashboardStats } from "@/components/DashboardStats";
import { SubmissionForms } from "@/components/SubmissionForms";
import { TrackingDashboard } from "@/components/TrackingDashboard";
import { useContentManagement } from "@/hooks/useContentManagement";

const Index = () => {
  const [showProgress, setShowProgress] = useState(false);
  const {
    // Data
    contentData,
    newsData,
    journalsData,
    rssData,
    approvedData,
    publishedData,
    dashboardStats,
    trackingStats,
    buttonStates,
    setButtonStates,
    isLoading,
    
    // Helper functions
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
    fetchAllData
  } = useContentManagement();

  useEffect(() => {
    const savedStates = localStorage.getItem('contentButtonStates');
    if (savedStates) {
      try {
        const parsed = JSON.parse(savedStates);
        setButtonStates(parsed);
      } catch (error) {
        console.error('Error parsing saved button states:', error);
        localStorage.removeItem('contentButtonStates');
      }
    }
  }, [setButtonStates]);

  useEffect(() => {
    localStorage.setItem('contentButtonStates', JSON.stringify(buttonStates));
  }, [buttonStates]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleProgressComplete = () => {
    setShowProgress(false);
    fetchAllData();
  };

  const handleProgressStart = () => {
    setShowProgress(true);
  };

  const handleDashboardStatClick = (statType: string) => {
    const tabsElement = document.querySelector('[data-state="active"]');
    if (tabsElement) {
      const tabTriggers = document.querySelectorAll('[role="tab"]');
      tabTriggers.forEach(trigger => {
        if (statType === 'approved' && trigger.textContent?.includes('Approved')) {
          (trigger as HTMLElement).click();
        } else if (statType === 'published' && trigger.textContent?.includes('Published')) {
          (trigger as HTMLElement).click();
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMWY1ZjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      
      <div className="relative container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Content Management Platform</span>
            </div>
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              BiohackYourself
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Streamline your content workflow with our intelligent management dashboard
            </p>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <DashboardStats stats={dashboardStats} onStatClick={handleDashboardStatClick} />
          </div>
        </div>

        <Tabs defaultValue="submit" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg rounded-xl p-1">
              <TabsTrigger value="submit" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Approved</span>
              </TabsTrigger>
              <TabsTrigger value="published" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Published</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">News</span>
              </TabsTrigger>
              <TabsTrigger value="journals" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Journals</span>
              </TabsTrigger>
              <TabsTrigger value="rss" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">RSS</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg transition-all duration-200">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Tracking</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="submit" className="space-y-6">
            <SubmissionForms onProgressStart={handleProgressStart} />
            
            {showProgress && (
              <ProgressTracker onComplete={handleProgressComplete} isVisible={showProgress} />
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">User-Generated Content Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review and approve user-submitted content for social media publishing
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(contentData, 'content').length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full w-fit mx-auto mb-6">
                      <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">No pending content submissions found</p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(contentData, 'content').map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleContentApproval}
                    onReject={handleContentRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    showRejectionDialog={true}
                    contentType="content"
                    showDeleteButton={true}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="approved" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Approved Content</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Content that has been approved and sent for scheduling
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {approvedData.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-full w-fit mx-auto mb-6">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No approved content found</p>
                  </CardContent>
                </Card>
              ) : (
                approvedData.map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={() => {}}
                    onReject={() => {}}
                    contentType="content"
                    buttonState="approved"
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="published" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Share2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Published Content</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Content that has been published to social media platforms
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {publishedData.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-200 rounded-full w-fit mx-auto mb-6">
                      <Share2 className="mx-auto h-12 w-12 text-purple-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No published content found</p>
                  </CardContent>
                </Card>
              ) : (
                publishedData.map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={() => {}}
                    onReject={() => {}}
                    contentType="content"
                    buttonState="approved"
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                    <Newspaper className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">News Content Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review automatically pulled news content for approval
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(newsData, 'news').length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-orange-100 to-red-200 rounded-full w-fit mx-auto mb-6">
                      <Newspaper className="mx-auto h-12 w-12 text-orange-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No pending news articles found</p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(newsData, 'news').map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleNewsApproval}
                    onReject={handleNewsRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    contentType="news"
                    showDeleteButton={true}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="journals" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Academic Journals Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review journal articles for content production approval
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(journalsData, 'journals').length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-indigo-100 to-blue-200 rounded-full w-fit mx-auto mb-6">
                      <BookOpen className="mx-auto h-12 w-12 text-indigo-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No pending journal articles found</p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(journalsData, 'journals').map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleJournalApproval}
                    onReject={handleJournalRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    contentType="journals"
                    showDeleteButton={true}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="rss" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                    <Rss className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">RSS Feed Content Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review RSS feed content for approval and publishing
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(rssData, 'rss').length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-teal-100 to-cyan-200 rounded-full w-fit mx-auto mb-6">
                      <Rss className="mx-auto h-12 w-12 text-teal-500" />
                    </div>
                    <p className="text-slate-500 text-lg">No pending RSS content found</p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(rssData, 'rss').map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleRssApproval}
                    onReject={handleRssRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    contentType="rss"
                    showDeleteButton={true}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <TrackingDashboard stats={trackingStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
