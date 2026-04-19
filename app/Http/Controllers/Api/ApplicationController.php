<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ApplicationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\GovernmentService;
use App\Models\Application;
use App\Jobs\SyncApplicationWithAgency;
use Illuminate\Support\Str;
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
    // 1. Basic validation for the ID and that 'documents' is present
    $request->validate([
        'government_service_id' => 'required|exists:government_services,id',
        'documents' => 'required|array', 
    ]);

    // 2. Fetch the service to get specific requirements
    $service = GovernmentService::findOrFail($request->government_service_id);
    $required = $service->required_documents; // e.g., ["Valid ID Copy", "KRA PIN Certificate", ...]

    $storedPaths = [];

    // 3. Manually validate each required file within the documents array
    foreach ($required as $docName) {
        // Look for the specific binary key shown in your payload screenshot
        if (!$request->hasFile("documents.$docName")) {
            return response()->json([
                'message' => 'The application is incomplete.',
                'errors' => [
                    'documents' => ["The $docName is required."]
                ]
            ], 422);
        }

      // 4. Store the file with its original extension and save the path
$file = $request->file("documents.$docName");

// Generate a unique name while preserving the original extension (e.g., .pdf, .png)
$fileName = Str::random(40) . '.' . $file->getClientOriginalExtension();

// Store it specifically on the 'public' disk
$path = $file->storeAs('applications', $fileName, 'public');

$storedPaths[$docName] = $path;
    }

    $reference = 'APP-' . strtoupper(Str::random(8));

    $application = Application::create([
        'user_id'               => $request->user()->id,
        'government_service_id' => $request->government_service_id,
        'application_reference' => $reference, // <--- Add this line
        'documents'             => $storedPaths, 
        'status'                => 'submitted', // Must match an item in your migration array
        'submitted_at'          => now(),      // Good practice since it's being filed now
    ]);

    return response()->json($application, 201);
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
