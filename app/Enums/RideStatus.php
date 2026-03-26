<?php

namespace App\Enums;

enum RideStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case IN_PROGRESS = 'in_progress';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
