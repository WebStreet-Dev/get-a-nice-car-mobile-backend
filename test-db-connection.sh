#!/bin/sh
# Test database connection script
# Run this in the backend container terminal

echo "Testing database connection..."
echo ""

# Check if DATABASE_URL is set
echo "1. Checking DATABASE_URL environment variable:"
if [ -z "$DATABASE_URL" ]; then
    echo "   ❌ DATABASE_URL is not set!"
    exit 1
else
    echo "   ✅ DATABASE_URL is set"
    # Mask password in output
    echo "   URL: $(echo $DATABASE_URL | sed 's/:[^:@]*@/:****@/')"
fi

echo ""
echo "2. Testing connection with psql:"
echo "   Installing postgresql-client..."

# Try to install postgresql client (Alpine)
apk add --no-cache postgresql-client 2>/dev/null || echo "   (postgresql-client might already be installed)"

echo ""
echo "3. Attempting to connect to database..."

# Extract connection details from DATABASE_URL
# Format: postgres://user:pass@host:port/db
DB_URL="$DATABASE_URL"

# Test connection
psql "$DB_URL" -c "SELECT version();" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database connection successful!"
else
    echo ""
    echo "❌ Database connection failed!"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Verify the database container is running"
    echo "2. Check if the hostname 'lwgk444swsk0sos4gkw4okgk' is correct"
    echo "3. Verify username and password match exactly"
    echo "4. Check if both containers are in the same network"
    echo ""
    echo "Try connecting manually:"
    echo "psql \"$DB_URL\" -c \"SELECT 1;\""
fi








