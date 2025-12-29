// Test database connection
import { prisma } from './prisma'

export async function testDatabase() {
  try {
    // Simple query to test connection
    const userCount = await prisma.user.count()
    console.log('✅ Database connection successful!')
    console.log(`📊 Current users in database: ${userCount}`)
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

