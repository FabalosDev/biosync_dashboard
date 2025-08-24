
import { supabase } from "@/integrations/supabase/client";

export class DatabaseService {
  // Content submissions
  static async saveContentSubmission(data: {
    submission_type: 'text' | 'image';
    content?: string;
    image_url?: string;
  }) {
    const { data: result, error } = await supabase
      .from('content_submissions')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Content reviews
  static async saveContentReview(data: {
    content_type: 'content' | 'news' | 'journals' | 'rss';
    title?: string;
    caption?: string;
    image_generated?: string;
    article_text?: string;
    article_authors?: string;
    source?: string;
    content_snippet?: string;
    sheet_name?: string;
    row_number?: number;
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
    image_query?: string;
  }) {
    const { data: result, error } = await supabase
      .from('content_reviews')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Update content review status
  static async updateContentReviewStatus(
    id: string,
    status: 'approved' | 'rejected',
    feedback?: string,
    image_query?: string
  ) {
    const user = (await supabase.auth.getUser()).data.user;
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    } else {
      updateData.rejected_by = user?.id;
      updateData.rejected_at = new Date().toISOString();
      if (feedback) updateData.feedback = feedback;
      if (image_query) updateData.image_query = image_query;
    }

    const { data: result, error } = await supabase
      .from('content_reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Timeline tracking
  static async addTimelineEntry(data: {
    content_type: 'content' | 'news' | 'journals' | 'rss';
    action: 'approved' | 'rejected' | 'scheduled' | 'published' | 'sent_for_regeneration';
    content_id?: string;
    metadata?: any;
  }) {
    const { data: result, error } = await supabase
      .from('content_timeline')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Get user's timeline
  static async getUserTimeline(userId: string) {
    const { data, error } = await supabase
      .from('content_timeline')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get content reviews
  static async getContentReviews() {
    const { data, error } = await supabase
      .from('content_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
