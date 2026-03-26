<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GovernmentService;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = ServiceCategory::with('governmentServices')->get();

        return response()->json($categories);
    }

    public function show(string $code): JsonResponse
    {
        $service = GovernmentService::where('code', $code)->firstOrFail();

        return response()->json($service);
    }
}
