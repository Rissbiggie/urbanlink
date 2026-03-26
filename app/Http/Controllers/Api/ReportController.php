<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CitizenReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reports = $request->user()->citizenReports()->latest()->paginate(15);

        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category' => 'nullable|string',
            'subject' => 'required|string',
            'description' => 'required|string',
            'attachments' => 'nullable|array',
        ]);

        $report = $request->user()->citizenReports()->create($data);

        return response()->json($report);
    }
}
