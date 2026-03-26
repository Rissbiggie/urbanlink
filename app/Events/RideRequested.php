<?php

namespace App\Events;

use App\Models\Ride;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RideRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public int $driverUserId, public Ride $ride)
    {
    }

    public function broadcastOn(): Channel
    {
        return new PrivateChannel("user.{$this->driverUserId}");
    }

    public function broadcastWith(): array
    {
        return [
            'ride_id' => $this->ride->id,
            'ride_reference' => $this->ride->ride_reference,
            'pickup' => [
                'address' => $this->ride->pickup_address,
                'lat' => $this->ride->pickup_lat,
                'lng' => $this->ride->pickup_lng,
            ],
            'dropoff' => [
                'address' => $this->ride->dropoff_address,
                'lat' => $this->ride->dropoff_lat,
                'lng' => $this->ride->dropoff_lng,
            ],
            'estimated_fare' => $this->ride->estimated_fare,
            'status' => $this->ride->status,
        ];
    }

    public function broadcastAs(): string
    {
        return 'ride.requested';
    }
}
