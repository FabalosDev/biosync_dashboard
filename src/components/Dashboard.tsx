// src/components/Index.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { AuthPage } from "@/components/AuthPage";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  Share2,
  Newspaper,
  Rss,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Stethoscope,
  LogOut,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ProgressTracker } from "@/components/ProgressTracker";
import { ContentApprovalCard } from "@/components/ContentApprovalCard";
import { DashboardStats } from "@/components/DashboardStats";
import { SubmissionForms } from "@/components/SubmissionForms";
import { TrackingDashboard } from "@/components/TrackingDashboard";
import { useContentManagement } from "@/hooks/useContentManagement";

const IndexPage = () => {
  const [showProgress, setShowProgress] = useState(false);

  const {
    contentData,
    newsData,
    rssData,
    dentistryData,
    rssDentistryData,
    approvedData,
    publishedData,
    dashboardStats,
    trackingStats,
    buttonStates,
    setButtonStates,
    isLoading,
    filterUnprocessedItems,
    handleDeleteContent,
    handleContentApproval,
    handleContentRejection,
    handleNewsApproval,
    handleNewsRejection,
    handleDentistryApproval,
    handleDentistryRejection,
    handleRssContentApproval,
    handleRssContentRejection,
    handleRssDentistryApproval,
    handleRssDentistryRejection,
    handleUndo,
    getButtonState,
    fetchAllData,
    rssNewsData,
    handleRssNewsApproval,
    handleRssNewsRejection,
  } = useContentManagement();

  useEffect(() => {
    const saved = localStorage.getItem("contentButtonStates");
    if (saved) {
      try {
        setButtonStates(JSON.parse(saved));
      } catch {
        localStorage.removeItem("contentButtonStates");
      }
    }
  }, [setButtonStates]);

  useEffect(() => {
    localStorage.setItem("contentButtonStates", JSON.stringify(buttonStates));
  }, [buttonStates]);

  useEffect(() => {
    fetchAllData();
    const id = setInterval(fetchAllData, 30000);
    return () => clearInterval(id);
  }, [fetchAllData]);

  const handleProgressComplete = () => {
    setShowProgress(false);
    fetchAllData();
  };
  const handleProgressStart = () => setShowProgress(true);

  const handleDashboardStatClick = (statType: string) => {
    const tabs = document.querySelectorAll('[role="tab"]');
    tabs.forEach((t) => {
      if (statType === "approved" && t.textContent?.includes("Approved"))
        (t as HTMLElement).click();
      if (statType === "published" && t.textContent?.includes("Published"))
        (t as HTMLElement).click();
    });
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Decorative bg must not capture clicks */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-no-repeat bg-center bg-cover"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMWY1ZjkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+")',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="relative z-10 container mx-auto px-4 pt-8">
          {/* Top bar: logo + pill + refresh */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/Foxther.png"
                alt="Fabaverse"
                className="w-24 h-auto"
                loading="eager"
              />
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-200/60 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">
                  Fabaverse Content Platform
                </span>
              </div>
            </div>

            {/* Refresh */}
            <Button
              onClick={fetchAllData}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {/* Title + subtitle */}
          <div className="text-center mt-8 space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Fabaverse
            </h1>
            <p className="text-slate-600 text-base md:text-lg">
              Welcome to your content command center. Streamline your pipeline
              in one place.
            </p>
          </div>

          {/* Soft glow backdrop for stats below */}
          <div className="relative mt-8">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 blur-3xl" />
          </div>
        </header>
        {/* Stats */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl"></div>
          <div className="relative">
            <DashboardStats
              stats={dashboardStats}
              onStatClick={handleDashboardStatClick}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="submit" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg rounded-xl p-1">
              <TabsTrigger
                value="submit"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Approved</span>
              </TabsTrigger>
              <TabsTrigger
                value="published"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Published</span>
              </TabsTrigger>
              <TabsTrigger
                value="news"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">News Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="dentistry"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Stethoscope className="h-4 w-4" />
                <span className="hidden sm:inline">Dentistry Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="rss"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">Media RSS</span>
              </TabsTrigger>
              <TabsTrigger
                value="rssNews"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">News RSS</span>
              </TabsTrigger>
              <TabsTrigger
                value="rssDentistry"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">Dentistry RSS</span>
              </TabsTrigger>
              <TabsTrigger
                value="tracking"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Tracking</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* SUBMIT */}
          <TabsContent value="submit" className="space-y-6">
            <SubmissionForms onProgressStart={handleProgressStart} />
            {showProgress && (
              <ProgressTracker
                onComplete={handleProgressComplete}
                isVisible={showProgress}
              />
            )}
          </TabsContent>

          {/* CONTENT */}
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
                  Review and approve media content for{" "}
                  <a
                    href="https://www.instagram.com/biohackyourselfmedia/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @BioHackYourselfMedia
                  </a>{" "}
                  account publishing
                  <div>
                    <p className="text-sm mt-1">
                      <a
                        href="https://docs.google.com/spreadsheets/d/1C1fnywWU1RMUQ4UmoKBurT7pI7WaffX2pn-6T45wVtY/edit?gid=0#gid=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open Sheet
                      </a>
                    </p>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(contentData, "content").length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full w-fit mx-auto mb-6">
                      <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">
                      No pending Media Content for submissions
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(contentData, "content").map(
                  (item: any) => (
                    <ContentApprovalCard
                      key={item.id}
                      item={item}
                      onApprove={handleContentApproval}
                      onReject={handleContentRejection}
                      onUndo={handleUndo}
                      onDelete={handleDeleteContent}
                      buttonState={getButtonState(item)}
                      showRejectionDialog
                      contentType="content"
                      showDeleteButton
                    />
                  )
                )
              )}
            </div>
          </TabsContent>

          {/* APPROVED */}
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
                    <p className="text-slate-500 text-lg">
                      No approved content found
                    </p>
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

          {/* PUBLISHED */}
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
                    <p className="text-slate-500 text-lg">
                      No published content found
                    </p>
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

          {/* NEWS */}
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
                  Review and approve news content for{" "}
                  <a
                    href="https://www.instagram.com/biohackyourselfnews/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    @BioHackYourselfNews
                  </a>
                  <div>
                    <p className="text-sm mt-1">
                      <a
                        href="https://docs.google.com/spreadsheets/d/1FNumIx65f0J1OoU8MWX4KwROQwis-TFB_rmwmr3e-WU/edit?gid=1306502811#gid=1306502811"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Open Sheet
                      </a>
                    </p>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(newsData, "news").length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-orange-100 to-red-200 rounded-full w-fit mx-auto mb-6">
                      <Newspaper className="mx-auto h-12 w-12 text-orange-500" />
                    </div>
                    <p className="text-slate-500 text-lg">
                      No pending News Content
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(newsData, "news").map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleNewsApproval}
                    onReject={handleNewsRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    contentType="news"
                    showDeleteButton
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* MEDIA RSS */}
          <TabsContent value="rss" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg">
                    <Rss className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">RSS Media Feed Content Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review RSS Media feed content for approval and publishing
                </CardDescription>
                <p className="text-sm mt-1">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1u6hNIrJM91COY54xzQrBDU6rfzrBIRpk2XhKHQawfsI/edit?gid=1338748256#gid=1338748256"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Sheet
                  </a>
                </p>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(rssData, "rss").length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-teal-100 to-cyan-200 rounded-full w-fit mx-auto mb-6">
                      <Rss className="mx-auto h-12 w-12 text-teal-500" />
                    </div>
                    <p className="text-slate-500 text-lg">
                      No pending Media RSS
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(rssData, "rss").map((item: any) => (
                  <ContentApprovalCard
                    key={item.id}
                    item={item}
                    onApprove={handleRssContentApproval}
                    onReject={handleRssContentRejection}
                    onUndo={handleUndo}
                    onDelete={handleDeleteContent}
                    buttonState={getButtonState(item)}
                    contentType="rss"
                    showDeleteButton
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* DENTISTRY RSS */}
          <TabsContent value="rssDentistry" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg">
                    <Rss className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Dentistry RSS Feed Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review dental-related RSS items for approval and publishing
                </CardDescription>
                <p className="text-sm mt-1">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1u6hNIrJM91COY54xzQrBDU6rfzrBIRpk2XhKHQawfsI/edit?gid=1069002450#gid=1069002450"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Sheet
                  </a>
                </p>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {filterUnprocessedItems(rssDentistryData, "rssDentistry")
                .length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-200 rounded-full w-fit mx-auto mb-6">
                      <Rss className="mx-auto h-12 w-12 text-green-600" />
                    </div>
                    <p className="text-slate-500 text-lg">
                      No pending Dentistry RSS
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterUnprocessedItems(rssDentistryData, "rssDentistry").map(
                  (item: any) => (
                    <ContentApprovalCard
                      key={item.id}
                      item={item}
                      onApprove={handleRssDentistryApproval}
                      onReject={handleRssDentistryRejection}
                      onUndo={handleUndo}
                      onDelete={handleDeleteContent}
                      buttonState={getButtonState(item)}
                      contentType="rssDentistry"
                      showDeleteButton
                    />
                  )
                )
              )}
            </div>
          </TabsContent>

          {/* RSS NEWS */}
          <TabsContent value="rssNews" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg">
                    <Rss className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">News RSS Feed Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review and manage News RSS feed items for approval
                </CardDescription>
              </CardHeader>
            </Card>

            {(() => {
              const pendingRssNews = filterUnprocessedItems(
                rssNewsData,
                "rssNews"
              );
              return (
                <div className="grid gap-6">
                  {pendingRssNews.length === 0 ? (
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                      <CardContent className="p-12 text-center">
                        <div className="p-4 bg-gradient-to-r from-indigo-100 to-blue-200 rounded-full w-fit mx-auto mb-6">
                          <Rss className="mx-auto h-12 w-12 text-indigo-500" />
                        </div>
                        <p className="text-slate-500 text-lg">
                          No pending News RSS
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    pendingRssNews.map((item: any) => (
                      <ContentApprovalCard
                        key={item.id}
                        item={item}
                        onApprove={handleRssNewsApproval}
                        onReject={handleRssNewsRejection}
                        onUndo={handleUndo}
                        onDelete={handleDeleteContent}
                        buttonState={getButtonState(item)}
                        contentType="rssNews"
                        showDeleteButton
                      />
                    ))
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* DENTISTRY */}
          <TabsContent value="dentistry" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-b border-slate-200/50">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl">Dentistry Content Review</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Review and manage dental-related content for approval
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {/* Check the LENGTH of the FILTERED array */}
              {filterUnprocessedItems(dentistryData, "dentistry").length ===
              0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-200 rounded-full w-fit mx-auto mb-6">
                      <Stethoscope className="mx-auto h-12 w-12 text-blue-600" />
                    </div>
                    <p className="text-slate-500 text-lg">
                      No pending Dentistry Content
                    </p>
                  </CardContent>
                </Card>
              ) : (
                /* MAP over the FILTERED array */
                filterUnprocessedItems(dentistryData, "dentistry").map(
                  (item: any) => (
                    <ContentApprovalCard
                      key={item.id ?? item.uid}
                      item={item}
                      onApprove={handleDentistryApproval}
                      onReject={handleDentistryRejection}
                      onUndo={handleUndo}
                      onDelete={handleDeleteContent}
                      buttonState={getButtonState(item)}
                      contentType="dentistry"
                      showDeleteButton
                    />
                  )
                )
              )}
            </div>
          </TabsContent>

          {/* TRACKING */}
          <TabsContent value="tracking" className="space-y-6">
            <TrackingDashboard stats={trackingStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuthSuccess={() => {
          /* post-login side effects if needed */
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="p-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
        <IndexPage />
      </div>
    </ErrorBoundary>
  );
}
