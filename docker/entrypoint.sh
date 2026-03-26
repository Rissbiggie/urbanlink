#!/bin/sh

# Ensure the database file exists
if [ ! -f /var/www/database/database.sqlite ]; then
    echo "Creating database.sqlite..."
    touch /var/www/database/database.sqlite
fi

# Fix permissions for the web server user (www-data)
echo "Setting permissions..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache /var/www/database
chmod -R 775 /var/www/storage /var/www/bootstrap/cache /var/www/database

# Run migrations (force for production environment)
echo "Running migrations..."
php artisan migrate --force

# Cache configuration for speed
echo "Caching Laravel internals..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start PHP-FPM in the background and Nginx in the foreground
echo "Starting Services..."
php-fpm -D && nginx -g 'daemon off;'