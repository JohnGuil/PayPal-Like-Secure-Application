<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'PayPal-Like Secure Application API',
        'version' => '1.0.0',
        'status' => 'active',
    ]);
});
