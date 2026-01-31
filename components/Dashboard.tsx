"use client";

import { useEffect, useState, useMemo } from 'react';
import { AssetRecord, ViewMode } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Trash2, TrendingUp, TrendingDown, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, ComposedChart, LabelList, Cell, PieChart, Pie } from 'recharts';

import AddAssetModal from './AddAssetModal';
import CommentsSidebar from './CommentsSidebar';

export default function Dashboard() {
    const [data, setData] = useState<AssetRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('All');
    const [activeTab, setActiveTab] = useState<'trend' | 'distribution' | 'history'>('trend');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch Data
    useEffect(() => {
        setLoading(true);
        fetch('/api/assets')
            .then(res => res.json())
            .then(json => {
                setData(json);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [refreshTrigger]);

    // Filter Logic
    const filteredData = useMemo(() => {
        if (viewMode === 'All') return data;
        return data.filter(d => d.owner === viewMode);
    }, [data, viewMode]);

    // Aggregation for Charts (Group by Date)
    const aggregatedData = useMemo(() => {
        const grouped = new Map<string, any>();

        filteredData.forEach(item => {
            const curr = grouped.get(item.date) || {
                date: item.date,
                net_worth: 0,
                total_asset: 0,
                net_cash: 0, savings: 0, stock_krw: 0, fixed_asset: 0
            };
            curr.net_worth += item.net_worth;
            curr.total_asset += item.total_asset;
            curr.net_cash += item.net_cash;
            curr.savings += item.savings;
            curr.stock_krw += item.stock_krw;
            curr.fixed_asset += item.fixed_asset;
            grouped.set(item.date, curr);
        });

        const sorted = Array.from(grouped.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate Deltas for Change Chart & Percentages for Asset Mix
        return sorted.map((item, idx) => {
            const prev = sorted[idx - 1];
            const change = prev ? item.net_worth - prev.net_worth : 0;
            const pct = prev && prev.net_worth !== 0 ? (change / prev.net_worth) * 100 : 0;
            const abs_change = Math.abs(change);

            // Asset Mix Percentages
            const total = item.net_cash + item.savings + item.stock_krw + item.fixed_asset || 1; // Avoid div by 0
            const pct_cash = Math.round((item.net_cash / total) * 100);
            const pct_savings = Math.round((item.savings / total) * 100);
            const pct_stock = Math.round((item.stock_krw / total) * 100);
            const pct_fixed = Math.round((item.fixed_asset / total) * 100);

            return {
                ...item,
                change,
                pct,
                abs_change,
                pct_cash, pct_savings, pct_stock, pct_fixed
            };
        });
    }, [filteredData]);

    const formatCompactNumber = (number: number) => {
        return new Intl.NumberFormat('ko-KR', { notation: "compact", maximumFractionDigits: 1 }).format(number);
    };

    const formatCurrency = (number: number) => {
        return `₩${number.toLocaleString()}`;
    };

    // Latest Metrics
    const latest = aggregatedData[aggregatedData.length - 1] || { net_worth: 0, total_asset: 0, net_cash: 0, savings: 0, stock_krw: 0, fixed_asset: 0 };
    const prev = aggregatedData[aggregatedData.length - 2] || { net_worth: 0 };
    const delta = latest.net_worth - prev.net_worth;

    // Distribution Data (Pie Chart)
    const distributionData = [
        { name: 'Cash', value: latest.net_cash, color: '#10B981' }, // Trendy Green
        { name: 'Savings', value: latest.savings, color: '#F59E0B' }, // Amber
        { name: 'Stock', value: latest.stock_krw, color: '#3B82F6' }, // Blue
        { name: 'Fixed', value: latest.fixed_asset, color: '#6366F1' }, // Indigo
    ].filter(d => d.value > 0);

    // Delete Handler
    const handleDelete = async (row_number: number) => {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            await fetch('/api/assets', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows: [row_number] }) // Sending array as per API
            });
            setRefreshTrigger(p => p + 1);
        } catch (e) {
            alert('Failed to delete');
        }
    };

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-[#F2F4F6] pb-20 font-sans text-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight text-[#191F28]">My Assets 🏡</h1>
                <button
                    onClick={() => setRefreshTrigger(p => p + 1)}
                    className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all text-gray-600"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            <main className="max-w-2xl mx-auto px-5 pt-6 space-y-6">

                {/* Global Filter Pills */}
                <div className="flex gap-2 p-1 bg-white rounded-2xl w-fit shadow-sm overflow-x-auto mx-auto scrollbar-hide">
                    {(['All', 'Husband', 'Wife', 'Joint'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`
                                relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                                ${viewMode === mode ? 'text-white' : 'text-gray-400 hover:text-gray-600'}
                            `}
                        >
                            {viewMode === mode && (
                                <motion.div
                                    layoutId="pill-bg"
                                    className="absolute inset-0 bg-[#3182F6] rounded-xl"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{mode}</span>
                        </button>
                    ))}
                </div>

                {/* KPI Cards (Always Visible) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <p className="text-sm font-medium text-gray-400 mb-1">Total Assets</p>
                        <h2 className="text-3xl font-extrabold text-[#191F28]">
                            ₩{latest.total_asset.toLocaleString()}
                        </h2>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                        <p className="text-sm font-medium text-gray-400 mb-1">Net Worth</p>
                        <div className="flex items-end gap-2">
                            <h2 className="text-3xl font-extrabold text-[#3182F6]">
                                ₩{latest.net_worth.toLocaleString()}
                            </h2>
                        </div>
                        <div className={`mt-2 flex items-center text-sm font-medium ${delta >= 0 ? 'text-[#F04452]' : 'text-[#3182F6]'}`}>
                            {delta >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                            {delta >= 0 ? '+' : ''}{delta.toLocaleString()} Won (vs last)
                        </div>
                    </div>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200">
                    {(['trend', 'distribution', 'history'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 pb-3 text-sm font-bold capitalize transition-all border-b-2 ${activeTab === tab
                                ? 'text-[#191F28] border-[#191F28]'
                                : 'text-gray-400 border-transparent hover:text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'trend' && (
                        <motion.div
                            key="trend"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Chart 1: Growth */}
                            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-[300px]">
                                <h3 className="text-lg font-bold text-[#191F28] mb-6">Asset Growth 📈</h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={aggregatedData}>
                                            <defs>
                                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3182F6" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#3182F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(val) => val.substring(5, 7) + '.' + val.substring(8, 10)}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                                tickFormatter={formatCompactNumber}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                formatter={(val: any) => [formatCurrency(val), 'Net Worth']}
                                                labelStyle={{ color: '#6B7280' }}
                                            />
                                            <Area type="monotone" dataKey="net_worth" stroke="#3182F6" strokeWidth={3} fillOpacity={1} fill="url(#colorNetWorth)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Net Worth Change (Composed: Bar + Line) */}
                            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-[300px]">
                                <h3 className="text-lg font-bold text-[#191F28] mb-6">Net Worth Change 📊</h3>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={aggregatedData} barGap={0}>
                                            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(val) => val.substring(5, 7) + '.' + val.substring(8, 10)}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F3F4F6' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                formatter={(val: any, name: any) => {
                                                    if (name === 'change') return [formatCurrency(val), 'Change'];
                                                    if (name === 'abs_change') return [formatCurrency(val), 'Abs Change'];
                                                    return [val, name];
                                                }}
                                                labelStyle={{ color: '#6B7280' }}
                                            />
                                            {/* Absolute Change Line (Dotted) */}
                                            <Line
                                                type="monotone"
                                                dataKey="abs_change"
                                                stroke="#9CA3AF"
                                                strokeDasharray="4 4"
                                                dot={false}
                                                strokeWidth={2}
                                            />
                                            {/* Change Bar (Green Theme) */}
                                            <Bar
                                                dataKey="change"
                                                radius={[6, 6, 0, 0]}
                                                fill="#10B981"
                                                barSize={40}
                                            >
                                                <LabelList
                                                    dataKey="pct"
                                                    position="inside"
                                                    fill="white"
                                                    fontSize={11}
                                                    fontWeight="bold"
                                                    formatter={(val: any) => val ? `${val.toFixed(1)}%` : ''}
                                                />
                                            </Bar>
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 3: Distribution History Stacked */}
                            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-[300px]">
                                <h3 className="text-lg font-bold text-[#191F28] mb-6">Distribution History 🏗️</h3>
                                <div className="h-[350px] w-full"> {/* Increased height for labels */}
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={aggregatedData} stackOffset="sign" barCategoryGap={20}>
                                            <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                                tickFormatter={(val) => val.substring(5, 7) + '.' + val.substring(8, 10)}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                formatter={(val: any, name: any, item: any) => {
                                                    // Calculate % for tooltip
                                                    const total = item.payload.total_asset;
                                                    const p = total ? ((val / total) * 100).toFixed(1) : '0';
                                                    return [`${formatCurrency(val)} (${p}%)`, name];
                                                }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                                            <Bar dataKey="net_cash" name="Cash" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]}>
                                                <LabelList dataKey="pct_cash" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 5 ? `${v}%` : ''} />
                                            </Bar>
                                            <Bar dataKey="savings" name="Savings" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]}>
                                                <LabelList dataKey="pct_savings" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 5 ? `${v}%` : ''} />
                                            </Bar>
                                            <Bar dataKey="stock_krw" name="Stock" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]}>
                                                <LabelList dataKey="pct_stock" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 5 ? `${v}%` : ''} />
                                            </Bar>
                                            <Bar dataKey="fixed_asset" name="Fixed" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]}>
                                                <LabelList dataKey="pct_fixed" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 5 ? `${v}%` : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'distribution' && (
                        <motion.div
                            key="distribution"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] min-h-[400px] flex flex-col items-center justify-center"
                        >
                            <h3 className="text-lg font-bold text-[#191F28] mb-6 w-full text-left">Current Allocation 🍰</h3>
                            {/* Simple Custom Donut using Recharts Pie or CSS? Recharts Pie. */}
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                                const RADIAN = Math.PI / 180;
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                                return (
                                                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                                                        {`${(percent * 100).toFixed(0)}%`}
                                                    </text>
                                                );
                                            }}
                                            labelLine={false}
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                            formatter={(val: any) => `₩${val.toLocaleString()}`}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-sm text-gray-400 mt-4 text-center">
                                * Debt is excluded from asset distribution.
                            </p>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                        >
                            <h3 className="text-lg font-bold text-[#191F28] mb-4">Detailed History 📝</h3>
                            <div className="space-y-4">
                                {filteredData.slice().reverse().map((item, idx) => (
                                    <div key={idx} className="group flex justify-between items-center py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#191F28]">₩{item.net_worth.toLocaleString()}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.owner === 'Husband' ? 'bg-blue-100 text-blue-600' : item.owner === 'Wife' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'}`}>
                                                    {item.owner}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{item.date} {item.memo && `· ${item.memo}`}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(item._row_number)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Delete Record"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {filteredData.length === 0 && <p className="text-center text-gray-400 py-4">No records found.</p>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="h-20"></div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 bg-[#3182F6] text-white p-4 rounded-full shadow-[0_8px_24px_rgba(49,130,246,0.3)] hover:scale-105 active:scale-95 transition-all z-40"
            >
                <Plus size={24} />
            </button>

            {/* Modal */}
            <AddAssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setRefreshTrigger(p => p + 1)}
            />

            {/* Comments Sidebar */}
            <CommentsSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Comment Trigger Button (Bottom Right, above FAB or beside?) User said "circle button with message icon". Positioning above FAB or slightly left. */}
            {/* Let's put it above the FAB for clean layout */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed bottom-24 right-6 bg-white text-[#191F28] p-4 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all z-40 border border-gray-100"
            >
                <div className="relative">
                    <MessageCircle size={24} />
                    {/* Notification dot functionality could be added here if we track 'read' state */}
                </div>
            </button>
        </div>
    );
}
