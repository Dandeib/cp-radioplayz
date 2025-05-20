'use server'

import { db } from "@/lib/db"

export async function createNews(content: string, image: string | null) {
    
    await db.news.create({
        data: {
            content,
            image
        }
    })	

    return true

}

export async function getAllNews() {
    
    const news = await db.news.findMany()

    return news
}

export async function updateNews(id: string, content: string, image: string | null) {
    
    await db.news.update({
        where: {
            id
        },
        data: {
            content,
            image
        }
    })

    return true
}

export async function deleteNews(id: string) {
    
    await db.news.delete({
        where: {
            id
        }
    })

    return true
}

export type ScheduledPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface ScheduledPostData {
  title: string;
  content: string;
  scheduledAt: Date;
  status?: ScheduledPostStatus;
}

export async function createScheduledPost(data: ScheduledPostData) {
  try {
    const post = await db.scheduledPost.create({
      data: {
        title: data.title,
        content: data.content,
        scheduledAt: data.scheduledAt,
        status: data.status || 'DRAFT',
      },
    });
    return { success: true, post };
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return { success: false, error: 'Failed to create scheduled post' };
  }
}

export async function getScheduledPosts(startDate?: Date, endDate?: Date) {
  try {
    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.scheduledAt = {
        gte: startDate,
        lte: endDate,
      };
    }
    const posts = await db.scheduledPost.findMany({
      where: whereClause,
      orderBy: {
        scheduledAt: 'asc',
      },
    });
    return { success: true, posts };
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return { success: false, error: 'Failed to fetch scheduled posts' };
  }
}

export async function getScheduledPostById(id: string) {
  try {
    const post = await db.scheduledPost.findUnique({
      where: { id },
    });
    if (!post) {
      return { success: false, error: 'Post not found' };
    }
    return { success: true, post };
  } catch (error) {
    console.error('Error fetching scheduled post by ID:', error);
    return { success: false, error: 'Failed to fetch scheduled post' };
  }
}

export async function updateScheduledPost(id: string, data: Partial<ScheduledPostData>) {
  try {
    const post = await db.scheduledPost.update({
      where: { id },
      data,
    });
    return { success: true, post };
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return { success: false, error: 'Failed to update scheduled post' };
  }
}

export async function deleteScheduledPost(id: string) {
  try {
    await db.scheduledPost.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return { success: false, error: 'Failed to delete scheduled post' };
  }
}