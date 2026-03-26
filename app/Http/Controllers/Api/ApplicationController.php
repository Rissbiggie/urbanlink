<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApplicationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApplicationController extends Controller
{
    public function __construct(protected ApplicationService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->service->listForUser($request->user()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'government_service_id' => 'required|exists:government_services,id',
            'form_data' => 'nullable|array',
            'documents' => 'nullable|array',
        ]);

        return response()->json($this->service->create($request->user(), $data));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $application = $this->service->getForUser($request->user(), $id);
        $this->authorize('view', $application);

        return response()->json($application);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'government_service_id' => 'sometimes|exists:government_services,id',
            'form_data' => 'nullable|array',
            'documents' => 'nullable|array',
        ]);

        $application = $this->service->getForUser($request->user(), $id);
        $this->authorize('update', $application);

        return response()->json($this->service->updateDraft($request->user(), $id, $data));
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $application = $this->service->getForUser($request->user(), $id);
        $this->authorize('delete', $application);

        $this->service->deleteDraft($request->user(), $id);

        return response()->json(['message' => 'Draft deleted']);
    }

    public function statusHistory(int $id): JsonResponse
    {
        $application = $this->service->getForUser(request()->user(), $id);

        return response()->json($this->service->statusHistory($application));
    }
}
