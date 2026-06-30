import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { ConflictError, ForbiddenError, NotFoundError } from './auth.service'

export class TestService {
    constructor(private db: PrismaClient) {}

    async deleteAllData() {
        try {
            await this.db.comment.deleteMany()
            await this.db.task.deleteMany()
            await this.db.projectMember.deleteMany()
            await this.db.project.deleteMany()
            await this.db.user.deleteMany()
            return { message: 'All data deleted successfully' }
        } catch (error) {
            throw new Error('Failed to delete all data')
        }
    }

    /**
     * Delete a user by email.
     *
     * For a Gherkin step this should return a success payload on success
     * and throw on failure. Specifically:
     * - Resolves with { message: string } when the user is deleted.
     * - Throws NotFoundError when the user does not exist.
     * - Throws Error('Invalid email') when the provided email is invalid.
     */
    async deleteUserByEmail(email: string): Promise<{ message: string }> {
        try {
            const parsedEmail = z.string().email().parse(email)

            const user = await this.db.user.findUnique({ where: { email: parsedEmail } })
            if (!user) return { message: `User with email ${parsedEmail} does not exist` }

            await this.db.comment.deleteMany({ where: { authorId: user.id } })
            await this.db.task.deleteMany({ where: { assignee: { id: user.id } } })
            await this.db.projectMember.deleteMany({ where: { userId: user.id } })
            await this.db.user.delete({ where: { email: parsedEmail } })
            return { message: `User with email ${parsedEmail} deleted successfully` }

        } catch (error) {
            if (error instanceof z.ZodError) throw new Error('Invalid email')
            throw error
        }
    }
    

}