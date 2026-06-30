import jwt from 'jsonwebtoken'

export function generateTestJWT(userId: string): string {
  return jwt.sign(
    { userId, email: 'pact@test.com' },
    process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    { expiresIn: '1h' }
  )
}
