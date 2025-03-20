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