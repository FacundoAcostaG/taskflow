import { PrismaClient } from '@prisma/client'

export class TestService {
  constructor(private db: PrismaClient) {}

  async deleteAllData() {
    try {
      await this.db.statusHistory.deleteMany()
      await this.db.comment.deleteMany()
      await this.db.task.deleteMany()
      await this.db.projectMember.deleteMany()
      await this.db.project.deleteMany()
      await this.db.user.deleteMany()

      return { message: 'All data deleted successfully' }
    } catch (error) {
      console.error('Error deleting all data:', error)
      throw error
    }
  }
}
