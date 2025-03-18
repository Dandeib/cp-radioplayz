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