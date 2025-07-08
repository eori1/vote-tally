// Environment validation for deployment
export function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missingVars = requiredEnvVars.filter(varName => {
    const value = process.env[varName]
    return !value || value.trim() === ''
  })

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars)
    return false
  }

  return true
}

// Check if we're in development, production, or preview
export function getEnvironmentInfo() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV, // 'production', 'preview', or 'development'
    vercelUrl: process.env.VERCEL_URL
  }
} 