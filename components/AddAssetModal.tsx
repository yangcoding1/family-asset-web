"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { AssetRecord } from '@/types';

interface AddAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddAssetModal({ isOpen, onClose, onSuccess }: AddAssetModalProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [owner, setOwner] = useState('Joint');
    const [formData, setFormData] = useState({
        net_cash: '',
        savings: '',
        stock_krw: '',
        fixed_asset: '',
        long_loan: '',
        memo: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculateTotals = () => {
        const cash = Number(formData.net_cash) || 0;
        const savings = Number(formData.savings) || 0;
        const stock = Number(formData.stock_krw) || 0;
        const fixed = Number(formData.fixed_asset) || 0;
        const loan = Number(formData.long_loan) || 0;

        const total = cash + savings + stock + fixed;
        const net = total - loan;
        return { total, net };
    };

    const { total, net } = calculateTotals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                date,
                owner,
                net_cash: Number(formData.net_cash) || 0,
                savings: Number(formData.savings) || 0,
                stock_krw: Number(formData.stock_krw) || 0,
                fixed_asset: Number(formData.fixed_asset) || 0,
                long_loan: Number(formData.long_loan) || 0,
                total_asset: total,
                net_worth: net,
                memo: formData.memo
            };

            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save');

            setFormData({
                net_cash: '', savings: '', stock_krw: '', fixed_asset: '', long_loan: '', memo: ''
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error saving data");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed inset-0 flex items-center justify-center z-[70] pointer-events-none p-4"
                    >
                        <div className="bg-white pointer-events-auto w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="text-xl font-bold text-[#191F28]">Add New Asset 📝</h3>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X size={24} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Body (Scrollable) */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form id="add-asset-form" onSubmit={handleSubmit} className="space-y-6">

                                    {/* Row 1 */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-600 block">Date</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#F2F4F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all font-medium text-[#191F28]"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-gray-600 block">Owner</label>
                                            <select
                                                value={owner}
                                                onChange={(e) => setOwner(e.target.value)}
                                                className="w-full px-4 py-3 bg-[#F2F4F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all appearance-none font-medium text-[#191F28]"
                                            >
                                                <option value="Joint">Joint (공동)</option>
                                                <option value="Husband">Husband</option>
                                                <option value="Wife">Wife</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-100 my-4" />

                                    {/* Assets Input Group */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Assets (Won)</h4>
                                        <InputGroup label="Net Cash (현금)" name="net_cash" value={formData.net_cash} onChange={handleChange} placeholder="0" />
                                        <InputGroup label="Savings (예적금)" name="savings" value={formData.savings} onChange={handleChange} placeholder="0" />
                                        <InputGroup label="Stock (주식)" name="stock_krw" value={formData.stock_krw} onChange={handleChange} placeholder="0" />
                                        <InputGroup label="Fixed Asset (부동산)" name="fixed_asset" value={formData.fixed_asset} onChange={handleChange} placeholder="0" />
                                    </div>

                                    <div className="h-px bg-gray-100 my-4" />

                                    {/* Liabilities */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Liabilities</h4>
                                        <InputGroup label="Loan (대출)" name="long_loan" value={formData.long_loan} onChange={handleChange} placeholder="0" isWarning />
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-sm font-semibold text-gray-600">Memo</label>
                                        <input
                                            name="memo"
                                            value={formData.memo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-[#F2F4F6] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] transition-all placeholder-gray-400"
                                            placeholder="Optional note..."
                                        />
                                    </div>

                                </form>
                            </div>

                            {/* Footer (Sticky) */}
                            <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
                                <div className="flex justify-between items-center mb-4 text-sm font-medium text-gray-500">
                                    <span>Total: ₩{total.toLocaleString()}</span>
                                    <span>Net: <b className="text-[#3182F6] text-lg">₩{net.toLocaleString()}</b></span>
                                </div>
                                <button
                                    form="add-asset-form"
                                    disabled={loading}
                                    className="w-full bg-[#3182F6] hover:bg-[#256DD0] active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-[0_4px_14px_rgba(49,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "Save Asset Record"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function InputGroup({ label, name, value, onChange, placeholder, isWarning = false }: any) {
    return (
        <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 w-1/3">{label}</label>
            <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₩</span>
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className={`
                        w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl 
                        focus:outline-none focus:ring-2 transition-all font-semibold text-right
                        ${isWarning ? 'focus:ring-red-400 text-red-500' : 'focus:ring-[#3182F6] text-[#191F28]'}
                    `}
                />
            </div>
        </div>
    );
}
