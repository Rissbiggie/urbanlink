<?php

namespace App\Enums;

enum DriverStatus: string
{
    case PENDING_VERIFICATION = 'pending_verification';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case INACTIVE = 'inactive';
}
