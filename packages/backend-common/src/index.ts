import * as z from 'zod'

export const JWT_USER_PASSWORD="Tajinder is dev"

export const UserSchemaZod=z.object({
    email:z.string(),
    firstname:z.string(),
    lastname:z.string(),
    password:z.string(),
    username:z.string(),
})

export const CreateRoomSchema=z.object({
    slug:z.string()
})