<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'users' => User::count(),
            'rides' => 
                \App\Models\Ride::count(),
            'revenue' => \App\Models\Payment::where('status', 'completed')->sum('amount'),
            'applications' => Application::count(),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        return response()->json($query->paginate(15));
    }

    public function applications(Request $request): JsonResponse
    {
        $query = Application::query();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function process(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'action' => 'required|string|in:approved,rejected,requires_action',
            'notes' => 'nullable|string',
        ]);

        $application = Application::findOrFail($id);
        $application->status = $data['action'];
        $application->processing_notes = $data['notes'] ?? null;
        $application->processed_at = now();
        $application->save();

        return response()->json($application);
    }
}
