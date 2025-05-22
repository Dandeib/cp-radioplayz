'use server'

import { signIn } from "@/auth"
import { db } from "@/lib/db"
import { loginSchema } from "@/lib/zod"
import { Roles } from "@prisma/client"
import { z } from "zod"
import bcrypt from "bcryptjs"

export async function getUsers() {
    const users = db.user.findMany()
    return users
}

export async function changeRole(role: Roles, userId: string) {
    const user = await db.user.update({
        where: { id: userId },
        data: { role },
    })
    return user
}

export async function deleteUser(userId: string) {
    const user = await db.user.delete({
        where: { id: userId },
    })
    return user
}

export async function createUser(formData: z.infer<typeof loginSchema>, role: Roles) {

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    await db.user.create({
    data: {
        name: formData.username,
        password: hashedPassword,
        role: role,
    },
    });

    return true
  
};

export const resetPassword = async (userId: string) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < 16; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(result, salt);

    await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    return result
}

export const getMantanceMode = async () => {
    const mode = await db.wartung.findUnique({ where: { id: '6822526b0b844db0a6312283'}})
    const wartungsmode = mode?.wartungsmode!

    return wartungsmode
}

export const setMantanceMode = async (mode: boolean) => {
    await db.wartung.update({
        where: { id: '6822526b0b844db0a6312283' },
        data: { wartungsmode: mode }
    })
}

export const setMantanceModePassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.wartung.update({
        where: { id: '6822526b0b844db0a6312283' },
        data: { password: hashedPassword }
    })
}

export const createApplication = async (title: string, description: string, image?: string) => {
    await db.bewerbungen.create({
        data: {
            title,
            description,
            image,
        }
    })

    return true
}

export const getAllApplications = async () => {
    const applications = await db.bewerbungen.findMany()
    return applications
}

export const deleteApplication = async (id: string) => {
    await db.bewerbungen.delete({
        where: { id }
    })
}

export const updateApplication = async (id: string, title: string, description: string, image?: string) => {
    await db.bewerbungen.update({
        where: { id },
        data: {
            title,
            description,
            image
        }
    })
}

export const setArchived = async (id: string, archived: boolean) => {

    await db.bewerbungen.update({
        where: {
            id
        },
        data: {
            archived
        }
    })
}
