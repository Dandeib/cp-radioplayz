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
    const mode = await db.warung.findUnique({ where: { id: '67e00ac3a64df1ec47ededfc'}})
    const wartungsmode = mode?.wartungsmode!

    return wartungsmode
}

export const setMantanceMode = async (mode: boolean) => {
    await db.warung.update({
        where: { id: '67e00ac3a64df1ec47ededfc' },
        data: { wartungsmode: mode }
    })
}
