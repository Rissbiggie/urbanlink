<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Catch-all route for the SPA
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
