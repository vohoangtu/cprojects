import React from 'react';
import { Link } from '@inertiajs/react';
import { ShieldCheck, Layers, GitPullRequest, FileText, CheckCircle2, Search, Bell } from 'lucide-react';

interface NavbarProps {
    currentRoute?: string;
}

export const Navbar: React.FC<NavbarProps> = () => {
    return (
        <header className="sticky top-0 z-40 w-full fluent-mica-acrylic border-b border-slate-200/70 shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand & Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/projects" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md group-hover:scale-105 transition-transform duration-200">
                                <div className="w-full h-full bg-white/95 rounded-[10px] flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        MCMS
                                    </span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-100/70 text-blue-700 border border-blue-200/50">
                                        2026 Core
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">SDLC Governance & Traceability</p>
                            </div>
                        </Link>

                        {/* Navigation Items */}
                        <nav className="hidden md:flex items-center gap-1">
                            <Link
                                href="/projects"
                                className="px-3.5 py-2 text-sm font-semibold rounded-lg text-blue-600 bg-blue-50/80 hover:bg-blue-100/60 transition-colors flex items-center gap-2"
                            >
                                <Layers className="w-4 h-4" />
                                Quản Lý Dự Án
                            </Link>
                        </nav>
                    </div>

                    {/* Search & Profile */}
                    <div className="flex items-center gap-3">
                        <div className="relative hidden sm:block">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã yêu cầu, commit, gate..."
                                className="pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
                            />
                        </div>

                        <button className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white/80 transition-colors relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-1"></div>

                        <div className="flex items-center gap-2.5 pl-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                MT
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-xs font-semibold text-slate-800 leading-none">Võ Hoàng Tú</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Lead Solution Architect</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
