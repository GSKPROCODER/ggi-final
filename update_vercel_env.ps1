$ErrorActionPreference = "Stop"

$DB_URL = "postgresql://postgres.aykvnqquppipffztlftb:Gurjotgsk%402002@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres"
$DIRECT = "postgresql://postgres.aykvnqquppipffztlftb:Gurjotgsk%402002@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

Write-Host "Removing old DATABASE_URL..."
npx vercel env rm DATABASE_URL production development preview -y
Write-Host "Adding new DATABASE_URL..."
$DB_URL | npx vercel env add DATABASE_URL production development preview

Write-Host "Removing old POSTGRES_URL..."
npx vercel env rm POSTGRES_URL production development preview -y
Write-Host "Adding new POSTGRES_URL..."
$DB_URL | npx vercel env add POSTGRES_URL production development preview

Write-Host "Removing old DIRECT_URL..."
npx vercel env rm DIRECT_URL production development preview -y
Write-Host "Adding new DIRECT_URL..."
$DIRECT | npx vercel env add DIRECT_URL production development preview

Write-Host "Triggering deployment..."
npx vercel --prod
