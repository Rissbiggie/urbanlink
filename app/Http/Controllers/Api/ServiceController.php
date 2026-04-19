<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GovernmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    /**
     * Display a listing of all services.
     */
    public function index(): JsonResponse
    {
        // Simple list since categories are removed
        $services = GovernmentService::all();
        return response()->json($services);
    }

    /**
     * Store a newly created service in the registry.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:government_services,code',
            'description' => 'required|string',
            'processing_time' => 'nullable|string',
           'required_documents'=> 'required|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the service without category dependency
        $service = GovernmentService::create($request->all());

        return response()->json([
            'message' => 'Service registered successfully',
            'data' => $service
        ], 201);
    }

    public function show($id): JsonResponse
{
    $service = GovernmentService::find($id);

    if (!$service) {
        return response()->json(['message' => 'Service not found'], 404);
    }

    return response()->json($service);
}
}