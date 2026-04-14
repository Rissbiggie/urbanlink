# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json vite.config.js ./
#tailwind.config.js ./
COPY resources ./resources
# Laravel Vite needs the public directory to know where to put the manifest
COPY public ./public 
RUN npm install --legacy-peer-deps && npm run build

# Stage 2: PHP & Laravel backend
FROM php:8.4-fpm

# Install system dependencies# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libsqlite3-dev \
    libpq-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    autoconf \
    g++ \
    make \
    vim  \
    nano \
    python3 \
    python3-pip \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Redis via PECL and native PHP extensions
RUN pecl install redis \
    && docker-php-ext-enable redis \
    && docker-php-ext-install pdo pdo_sqlite pdo_pgsql bcmath gd zip
# Install PHP extensions (Cleaned up for PHP 8.4)
RUN docker-php-ext-install pdo pdo_sqlite pdo_pgsql bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy existing application directory contents
COPY . .

# Copy built assets from Stage 1
# Ensure this matches your vite.config.js output path!
COPY --from=frontend-builder /app/public/build ./public/build

# Install PHP dependencies
RUN composer install --no-interaction --no-dev --prefer-dist --optimize-autoloader

# Setup permissions for Alpine/Debian www-data user
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Nginx config (Ensure these files exist in your local docker/ folder)
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["entrypoint.sh"]