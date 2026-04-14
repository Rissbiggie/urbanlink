<?php

namespace App\Services;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class PasswordPolicyService
{
    /**
     * Validate password against security policies
     */
    public function validatePassword(string $password, array $options = []): array
    {
        $errors = [];
        $rules = $this->getPasswordRules($options);

        // Check minimum length
        if (strlen($password) < $rules['min_length']) {
            $errors[] = "Password must be at least {$rules['min_length']} characters long";
        }

        // Check maximum length
        if (strlen($password) > $rules['max_length']) {
            $errors[] = "Password must not exceed {$rules['max_length']} characters";
        }

        // Check for uppercase letters
        if ($rules['require_uppercase'] && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }

        // Check for lowercase letters
        if ($rules['require_lowercase'] && !preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }

        // Check for numbers
        if ($rules['require_numbers'] && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }

        // Check for special characters
        if ($rules['require_symbols'] && !preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }

        // Check against common passwords
        if ($this->isCommonPassword($password)) {
            $errors[] = 'Password is too common. Please choose a more unique password';
        }

        // Check for repeated characters
        if ($rules['prevent_repeated_chars'] && $this->hasRepeatedCharacters($password)) {
            $errors[] = 'Password must not contain repeated characters';
        }

        // Check for sequential characters
        if ($rules['prevent_sequential'] && $this->hasSequentialCharacters($password)) {
            $errors[] = 'Password must not contain sequential characters';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'strength' => $this->calculatePasswordStrength($password),
        ];
    }

    /**
     * Get password policy rules
     */
    public function getPasswordRules(array $options = []): array
    {
        return array_merge([
            'min_length' => config('auth.passwords.min_length', 8),
            'max_length' => config('auth.passwords.max_length', 128),
            'require_uppercase' => config('auth.passwords.require_uppercase', true),
            'require_lowercase' => config('auth.passwords.require_lowercase', true),
            'require_numbers' => config('auth.passwords.require_numbers', true),
            'require_symbols' => config('auth.passwords.require_symbols', true),
            'prevent_repeated_chars' => config('auth.passwords.prevent_repeated_chars', false),
            'prevent_sequential' => config('auth.passwords.prevent_sequential', false),
            'prevent_common_passwords' => config('auth.passwords.prevent_common_passwords', true),
        ], $options);
    }

    /**
     * Calculate password strength score (0-100)
     */
    public function calculatePasswordStrength(string $password): int
    {
        $score = 0;
        $length = strlen($password);

        // Length scoring
        if ($length >= 8) $score += 25;
        if ($length >= 12) $score += 15;
        if ($length >= 16) $score += 10;

        // Character variety scoring
        if (preg_match('/[a-z]/', $password)) $score += 10;
        if (preg_match('/[A-Z]/', $password)) $score += 10;
        if (preg_match('/[0-9]/', $password)) $score += 10;
        if (preg_match('/[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/', $password)) $score += 10;

        // Complexity bonuses
        if ($length >= 12 && preg_match('/[a-zA-Z]/', $password) && preg_match('/[0-9]/', $password)) {
            $score += 10;
        }

        // Penalties
        if ($this->isCommonPassword($password)) $score -= 20;
        if ($this->hasRepeatedCharacters($password)) $score -= 10;
        if ($this->hasSequentialCharacters($password)) $score -= 10;

        return max(0, min(100, $score));
    }

    /**
     * Check if password is in common passwords list
     */
    private function isCommonPassword(string $password): bool
    {
        $commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            '1234567890', 'password1', 'qwerty123', 'welcome123'
        ];

        return in_array(strtolower($password), $commonPasswords);
    }

    /**
     * Check for repeated characters (e.g., aaa, 111)
     */
    private function hasRepeatedCharacters(string $password): bool
    {
        return preg_match('/(.)\1{2,}/', $password);
    }

    /**
     * Check for sequential characters (e.g., abc, 123, xyz)
     */
    private function hasSequentialCharacters(string $password): bool
    {
        $sequential = [
            'abcdefghijklmnopqrstuvwxyz',
            'qwertyuiopasdfghjklzxcvbnm',
            '01234567890',
            '09876543210'
        ];

        $lowerPassword = strtolower($password);

        foreach ($sequential as $sequence) {
            for ($i = 0; $i <= strlen($sequence) - 3; $i++) {
                $chunk = substr($sequence, $i, 3);
                if (strpos($lowerPassword, $chunk) !== false) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get password strength label
     */
    public function getPasswordStrengthLabel(int $strength): string
    {
        if ($strength < 25) return 'Very Weak';
        if ($strength < 50) return 'Weak';
        if ($strength < 75) return 'Good';
        if ($strength < 90) return 'Strong';
        return 'Very Strong';
    }

    /**
     * Generate a secure password
     */
    public function generateSecurePassword(int $length = 12): string
    {
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        $symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        $allChars = $lowercase . $uppercase . $numbers . $symbols;

        $password = '';

        // Ensure at least one character from each required set
        $password .= $lowercase[rand(0, strlen($lowercase) - 1)];
        $password .= $uppercase[rand(0, strlen($uppercase) - 1)];
        $password .= $numbers[rand(0, strlen($numbers) - 1)];
        $password .= $symbols[rand(0, strlen($symbols) - 1)];

        // Fill the rest randomly
        for ($i = 4; $i < $length; $i++) {
            $password .= $allChars[rand(0, strlen($allChars) - 1)];
        }

        // Shuffle the password
        return str_shuffle($password);
    }

    /**
     * Check if password needs to be changed based on policy
     */
    public function passwordNeedsChange(\App\Models\User $user): bool
    {
        $maxAge = config('auth.passwords.max_age_days', 90); // Default 90 days

        if (!$maxAge) return false;

        $lastChanged = $user->password_changed_at ?? $user->created_at;

        return $lastChanged->addDays($maxAge)->isPast();
    }

    /**
     * Update user's password with policy enforcement
     */
    public function updatePassword(\App\Models\User $user, string $newPassword): bool
    {
        $validation = $this->validatePassword($newPassword);

        if (!$validation['valid']) {
            Log::warning('Password update failed validation', [
                'user_id' => $user->id,
                'errors' => $validation['errors']
            ]);
            return false;
        }

        $user->password = Hash::make($newPassword);
        $user->password_changed_at = now();
        $user->save();

        Log::info('Password updated successfully', ['user_id' => $user->id]);

        return true;
    }
}