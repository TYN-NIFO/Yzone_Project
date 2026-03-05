$env:PGPASSWORD = "Amutha@1982"

Write-Host "Dropping existing database..."
psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS yzone;"

Write-Host "Creating new database..."
psql -U postgres -d postgres -c "CREATE DATABASE yzone;"

Write-Host "Running schema..."
Get-Content database/schema.sql | psql -U postgres -d yzone

Write-Host "Database setup complete!"
