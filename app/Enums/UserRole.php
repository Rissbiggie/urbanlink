<?php

namespace App\Enums;

enum UserRole: string
{
    case CITIZEN = 'citizen';
    case DRIVER = 'driver';
    case GOVERNMENT_OFFICER = 'officer';
    case ADMIN = 'admin';
}
