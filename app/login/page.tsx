"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError(true);
                setPin('');
            }
        } catch (err) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F2F4F6] p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-8 text-center"
            >
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-[#3182F6]">
                    <Lock size={32} />
                </div>

                <h1 className="text-2xl font-bold text-[#191F28] mb-2">Welcome Back</h1>
                <p className="text-gray-500 mb-8 text-sm">Please enter the family access PIN.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => { setPin(e.target.value); setError(false); }}
                            placeholder="Enter PIN"
                            className={`w-full text-center text-2xl tracking-widest bg-gray-50 border-2 rounded-2xl p-4 focus:outline-none transition-all placeholder:text-gray-300
                                ${error ? 'border-red-200 bg-red-50 text-red-500' : 'border-transparent focus:border-[#3182F6] focus:bg-white'}
                            `}
                            maxLength={8}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !pin}
                        className="w-full bg-[#3182F6] hover:bg-[#2c72d9] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
                    >
                        {loading ? 'Verifying...' : 'Unlock Dashboard'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
