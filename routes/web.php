<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Catch-all route for the SPA (but not API routes)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api/).*')->name('spa');

