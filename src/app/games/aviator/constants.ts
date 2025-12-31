// Payment methods with minimum amounts and card numbers
export const paymentMethods = [
    { id: 'uzcard', name: 'UZCARD', label: 'Transfer to UZCARD', logo: '/images/uzcardlogo.svg', minAmount: 100000, maxAmount: 5000000, cardLabel: 'Bank card', transferLabel: 'transfer to UZCARD', cardNumber: '5614 6820 3180 3424' },
    { id: 'humo', name: 'HUMO', label: 'Transfer to HUMO', logo: '/images/humologo1.png', minAmount: 100000, maxAmount: 5000000, cardLabel: 'Bank card', transferLabel: 'transfer to HUMO', cardNumber: '5614 6820 3180 3424' },
    { id: 'payme', name: 'PayMe', label: 'Transfer to PayMe', logo: '/images/payme-logo.svg', minAmount: 145000, maxAmount: 6500000, cardLabel: 'Bank card', transferLabel: 'transfer to PAYME', cardNumber: '5614 6820 3180 3424' },
    { id: 'click', name: 'CLICK', label: 'Transfer to CLICK', logo: '/images/logo_click.svg', minAmount: 100000, maxAmount: 5000000, cardLabel: 'Bank card', transferLabel: 'transfer to CLICK', cardNumber: '5614 6820 3180 3424' },
];

export type PaymentMethod = typeof paymentMethods[0];

// Quick amount options
export const quickAmounts = [
    { value: 500000, label: '500 000.00 UZS' },
    { value: 650000, label: '650 000.00 UZS' },
    { value: 900000, label: '900 000.00 UZS' },
];

// Withdrawal methods
export const withdrawMethods = [
    { id: 'uzcard', name: 'UZCARD', label: 'Pul chiqarish UZCARD', logo: '/images/uzcardlogo.svg', minAmount: 325000, maxAmount: 15000000, cardLabel: 'Bank card', transferLabel: 'Pul chiqarish UZCARD', cardFormat: '8600123412341234' },
    { id: 'humo', name: 'HUMO', label: 'Pul chiqarish HUMO', logo: '/images/humologo1.png', minAmount: 325000, maxAmount: 15000000, cardLabel: 'Bank card', transferLabel: 'Pul chiqarish HUMO', cardFormat: '9860123412341234' },
];

export type WithdrawMethod = typeof withdrawMethods[0];

// Format number with spaces
export const formatAmount = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Format time remaining
export const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} min : ${secs.toString().padStart(2, '0')} sec`;
};

export interface PaymentRequest {
    id: string;
    user_id: string;
    method: string;
    amount: number;
    card_number: string;
    status: 'pending' | 'awaiting_confirmation' | 'completed' | 'expired' | 'cancelled';
    expires_at: string;
    created_at: string;
}
