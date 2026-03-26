<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'UrbanLink') }}</title>

        @viteReactRefresh 
        
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
        <div id="app"></div>
    </body>
</html>