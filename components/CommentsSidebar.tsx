"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, MessageCircle } from 'lucide-react';
import { CommentRecord } from '@/types';

interface CommentsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommentsSidebar({ isOpen, onClose }: CommentsSidebarProps) {
    const [comments, setComments] = useState<CommentRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [owner, setOwner] = useState<'Husband' | 'Wife'>('Husband');
    const [message, setMessage] = useState('');

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/comments');
            if (res.ok) {
                const json = await res.json();
                setComments(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchComments();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSubmitting(true);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: today,
                    owner,
                    message
                })
            });

            if (res.ok) {
                setMessage('');
                fetchComments(); // Refresh list
            } else {
                alert('Failed to save comment');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving comment');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-50"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-[#F2F4F6] z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10">
                            <h2 className="text-lg font-bold text-[#191F28] flex items-center gap-2">
                                <MessageCircle size={20} className="text-[#3182F6]" />
                                Family Comments
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                <X size={24} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading && <div className="text-center py-10 text-gray-400">Loading inputs...</div>}

                            {!loading && comments.length === 0 && (
                                <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
                                    <MessageCircle size={40} className="opacity-20" />
                                    <p>No comments yet. Say hello!</p>
                                </div>
                            )}

                            {comments.map((c, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col ${c.owner === 'Husband' ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`
                                        max-w-[85%] p-3 rounded-2xl text-sm relative shadow-sm
                                        ${c.owner === 'Husband'
                                            ? 'bg-[#3182F6] text-white rounded-tr-none'
                                            : 'bg-white text-[#191F28] rounded-tl-none border border-gray-100'}
                                    `}>
                                        <p className="whitespace-pre-wrap">{c.message}</p>
                                    </div>
                                    <span className="text-[11px] text-gray-400 mt-1 px-1">
                                        {c.owner} · {c.date}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="bg-white p-4 pb-8 border-t border-gray-100 shrink-0">
                            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                {/* Owner Selector */}
                                <div className="flex gap-2">
                                    {(['Husband', 'Wife'] as const).map((who) => (
                                        <button
                                            key={who}
                                            type="button"
                                            onClick={() => setOwner(who)}
                                            className={`
                                                flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                                                ${owner === who
                                                    ? (who === 'Husband' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-1' : 'bg-pink-100 text-pink-600 ring-2 ring-pink-500 ring-offset-1')
                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
                                            `}
                                        >
                                            {who}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full bg-gray-50 rounded-2xl p-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-[#3182F6]/20 transition-all text-[#191F28]"
                                        rows={3}
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting || !message.trim()}
                                        className="absolute bottom-3 right-3 p-2 bg-[#3182F6] text-white rounded-full shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
                                    >
                                        {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
