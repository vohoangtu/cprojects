import React, { useState } from 'react';
import { 
    Layers, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    Copy, 
    Check, 
    Download, 
    Maximize2, 
    Shield, 
    Cpu, 
    Database, 
    Globe, 
    Server,
    ExternalLink
} from 'lucide-react';

interface C4DiagramViewerProps {
    projectCode: string;
    projectName: string;
}

export function C4DiagramViewer({ projectCode, projectName }: C4DiagramViewerProps) {
    const [c4Level, setC4Level] = useState<'context' | 'container'>('container');
    const [zoom, setZoom] = useState<number>(100);
    const [selectedNode, setSelectedNode] = useState<{
        title: string;
        type: string;
        tech: string;
        zone: string;
        protocol: string;
        desc: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopyMermaid = () => {
        const mermaidCode = c4Level === 'context' 
            ? `C4Context
    title System Context diagram for ${projectName} [${projectCode}]
    Person(user, "Người Dùng Cuối / Khách Hàng", "Sử dụng ứng dụng web / mobile")
    Person_Ext(admin, "Quản Trị Viên & Lead SA", "Võ Hoàng Tú - Giám sát SDLC & Hệ thống")
    System(mcms, "${projectName}", "Hệ thống lõi xử lý nghiệp vụ microservices")
    System_Ext(gateway, "Payment Gateway (Napas/VNPay)", "Xử lý thanh toán số & đối soát")
    System_Ext(ekyc, "eKYC Identity Provider", "Xác thực danh tính sinh trắc học")
    System_Ext(bank, "Core Banking Ledger", "Sổ cái tài chính ngân hàng")
    
    Rel(user, mcms, "Sử dụng dịch vụ qua HTTPS/WSS")
    Rel(admin, mcms, "Quản trị, duyệt Quality Gates qua mTLS")
    Rel(mcms, gateway, "Giao dịch thanh toán (REST/OAuth2)")
    Rel(mcms, ekyc, "Xác minh WebAuthn/FIDO2")
    Rel(mcms, bank, "Đồng bộ giao dịch qua Kafka Streams")`
            : `C4Container
    title Container diagram for ${projectName} [${projectCode}]
    Container(spa, "Web SPA (Frontend)", "React 19, TypeScript, Fluent 2 Mica", "Cung cấp giao diện người dùng thời gian thực")
    Container(api, "API Gateway / Backend Core", "Laravel 13, PHP 8.5, Repository-Actions", "Xác thực JWT, Rate Limiting, Điều hướng Microservices")
    ContainerDb(db, "Primary Relational DB", "PostgreSQL 17 / Sharding", "Lưu trữ dữ liệu nghiệp vụ, Audit Logs HMAC-SHA256")
    ContainerDb(cache, "In-Memory Cache", "Redis 8.0 Cluster", "Lưu trữ Session, Cache truy vấn và Rate Limits")
    Container(queue, "Event Streaming Bus", "Apache Kafka / Event Streams", "Xử lý bất đồng bộ & phân tán dữ liệu")
    
    Rel(spa, api, "API calls", "JSON/HTTPS")
    Rel(api, db, "Đọc/Ghi dữ liệu", "TCP/SSL")
    Rel(api, cache, "Đọc/Ghi cache", "RESP3")
    Rel(api, queue, "Publish events", "Binary TCP")`;

        navigator.clipboard.writeText(mermaidCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fluent-card p-5 bg-white/95 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900">
                            Sơ Đồ Kiến Trúc Hệ Thống (C4 Model Visualizer)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                            Dự án: {projectName} [{projectCode}]
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Level Selector */}
                    <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs font-semibold">
                        <button
                            onClick={() => { setC4Level('context'); setSelectedNode(null); }}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                c4Level === 'context' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Level 1: System Context
                        </button>
                        <button
                            onClick={() => { setC4Level('container'); setSelectedNode(null); }}
                            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                c4Level === 'container' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Level 2: Container
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setZoom(prev => Math.max(70, prev - 15))}
                            className="p-1.5 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                            title="Thu nhỏ"
                        >
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-mono px-2 text-slate-600 font-semibold">{zoom}%</span>
                        <button
                            onClick={() => setZoom(prev => Math.min(140, prev + 15))}
                            className="p-1.5 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                            title="Phóng to"
                        >
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => setZoom(100)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                            title="Khôi phục 100%"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        onClick={handleCopyMermaid}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Sao chép mã nguồn Mermaid"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                        {copied ? 'Đã chép' : 'Copy Mermaid'}
                    </button>
                </div>
            </div>

            {/* Interactive Canvas */}
            <div className="relative overflow-x-auto p-6 bg-slate-900/5 rounded-xl border border-slate-200/50 min-h-[360px] flex items-center justify-center">
                <div 
                    className="transition-transform duration-300 origin-center w-full max-w-4xl"
                    style={{ transform: `scale(${zoom / 100})` }}
                >
                    {c4Level === 'context' ? (
                        /* Level 1 Context Diagram */
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* Left: Actors */}
                            <div className="space-y-4">
                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Người Dùng Cuối (Khách Hàng)',
                                        type: 'Person (Actor)',
                                        tech: 'Web Browser / Mobile App',
                                        zone: 'Public Internet',
                                        protocol: 'HTTPS / TLS 1.3',
                                        desc: 'Khách hàng sử dụng dịch vụ thanh toán, tra cứu số dư và giao dịch trực tuyến.'
                                    })}
                                    className="p-4 rounded-xl bg-blue-600 text-white cursor-pointer hover:shadow-lg transition-all border border-blue-500 hover:scale-102"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Globe className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">[Person]</span>
                                    </div>
                                    <h5 className="font-bold text-sm">Người Dùng Cuối</h5>
                                    <p className="text-[11px] opacity-85 mt-1">Truy cập qua HTTPS / WebAuthn</p>
                                </div>

                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Võ Hoàng Tú (Lead Solution Architect)',
                                        type: 'Person (Governance)',
                                        tech: 'Secured Admin Terminal / VPN',
                                        zone: 'Internal Corporate Network',
                                        protocol: 'mTLS / SSH Key Auth',
                                        desc: 'Chủ trì thiết kế kiến trúc, phê duyệt Quality Gates và quản trị tính toàn vẹn hệ thống.'
                                    })}
                                    className="p-4 rounded-xl bg-indigo-700 text-white cursor-pointer hover:shadow-lg transition-all border border-indigo-600 hover:scale-102"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">[Lead Architect]</span>
                                    </div>
                                    <h5 className="font-bold text-sm">Võ Hoàng Tú</h5>
                                    <p className="text-[11px] opacity-85 mt-1">Phê duyệt Quality Gate & SDLC</p>
                                </div>
                            </div>

                            {/* Center: MCMS Core System */}
                            <div 
                                onClick={() => setSelectedNode({
                                    title: `${projectName} Core System`,
                                    type: 'Software System',
                                    tech: 'Laravel 13 • PHP 8.5 • React 19 • PostgreSQL',
                                    zone: 'Private VPC / Kubernetes Cluster',
                                    protocol: 'Internal Service Mesh (gRPC/HTTP2)',
                                    desc: 'Hệ thống phần mềm trung tâm xử lý quy trình phát triển, kiểm toán bất biến và bảo đảm chất lượng chuyển giao.'
                                })}
                                className="p-6 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-800 text-white cursor-pointer hover:shadow-xl transition-all border-2 border-indigo-400/50 hover:scale-102 text-center"
                            >
                                <div className="inline-flex p-3 rounded-xl bg-white/10 mb-2">
                                    <Cpu className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-wider block text-blue-200">[Core System]</span>
                                <h4 className="font-extrabold text-base mt-1">{projectName}</h4>
                                <p className="text-xs text-indigo-100 mt-2 leading-relaxed">
                                    Nền tảng lõi điều phối 7 Pha SDLC, Kiểm toán HMAC-SHA256, RTM 5 tầng
                                </p>
                                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-center gap-2 text-[10px] font-mono text-indigo-200">
                                    <span>Repository-Actions</span>
                                    <span>•</span>
                                    <span>Zero Trust</span>
                                </div>
                            </div>

                            {/* Right: External Systems */}
                            <div className="space-y-4">
                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Cổng Thanh Toán Napas / VNPay',
                                        type: 'External System',
                                        tech: 'ISO 8583 / REST API Gateway',
                                        zone: 'Financial Intermediary Zone',
                                        protocol: 'HTTPS / Mutual TLS (mTLS)',
                                        desc: 'Xử lý quyết toán liên ngân hàng và thanh toán trực tuyến 24/7.'
                                    })}
                                    className="p-4 rounded-xl bg-slate-800 text-white cursor-pointer hover:shadow-lg transition-all border border-slate-700 hover:scale-102"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <ExternalLink className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">[External]</span>
                                    </div>
                                    <h5 className="font-bold text-sm">Payment Gateway</h5>
                                    <p className="text-[11px] text-slate-300 mt-1">Cổng thanh toán Napas 2.0</p>
                                </div>

                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Core Banking Ledger',
                                        type: 'External Core System',
                                        tech: 'Mainframe / Distributed Ledger',
                                        zone: 'Secure Financial Core',
                                        protocol: 'Kafka Streams / MQ Series',
                                        desc: 'Hệ thống kế toán và sổ cái tài chính của ngân hàng.'
                                    })}
                                    className="p-4 rounded-xl bg-slate-800 text-white cursor-pointer hover:shadow-lg transition-all border border-slate-700 hover:scale-102"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Database className="w-4 h-4 text-purple-400" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">[External]</span>
                                    </div>
                                    <h5 className="font-bold text-sm">Core Banking Ledger</h5>
                                    <p className="text-[11px] text-slate-300 mt-1">Sổ cái tài chính ngân hàng</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Level 2 Container Diagram */
                        <div className="space-y-6">
                            {/* Layer 1: Client & Gateway */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Single Page Application (SPA Frontend)',
                                        type: 'Container (Web App)',
                                        tech: 'React 19, TypeScript, Fluent 2 Mica, Vite v8',
                                        zone: 'Client Web Browser',
                                        protocol: 'HTTPS / WSS',
                                        desc: 'Giao diện tương tác người dùng theo thẩm mỹ Mica Light Colorful, tối ưu độ mượt mà 60fps.'
                                    })}
                                    className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 cursor-pointer hover:shadow-md transition-all hover:border-blue-400"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">SPA Frontend</span>
                                        <Globe className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h5 className="font-bold text-sm mt-1">Web Client (React 19)</h5>
                                    <p className="text-xs text-blue-800 mt-1">Microsoft Fluent 2 Mica UI • Inertia.js v2</p>
                                </div>

                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'API Gateway & Application Server',
                                        type: 'Container (Backend Core)',
                                        tech: 'Laravel 13, PHP 8.5, Repository-Actions Pattern',
                                        zone: 'Application Cluster (DMZ/Private)',
                                        protocol: 'HTTP/2, JSON:API',
                                        desc: 'Xử lý logic 7 pha SDLC, kiểm soát cổng phê duyệt, sinh chữ ký HMAC-SHA256 bất biến.'
                                    })}
                                    className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 cursor-pointer hover:shadow-md transition-all hover:border-indigo-400"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Backend Core</span>
                                        <Server className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <h5 className="font-bold text-sm mt-1">Laravel 13 Engine (PHP 8.5)</h5>
                                    <p className="text-xs text-indigo-800 mt-1">Repository - Actions Layer • HMAC Non-repudiation</p>
                                </div>
                            </div>

                            {/* Connection Arrow */}
                            <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-slate-400">
                                <span>▼ HTTPS / REST API / Websocket</span>
                            </div>

                            {/* Layer 2: Persistence & Cache & Queue */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'PostgreSQL Database Cluster',
                                        type: 'Container (Database)',
                                        tech: 'PostgreSQL 17 • Master / Read-Replicas',
                                        zone: 'Isolated Database Subnet',
                                        protocol: 'TCP / SSL Encryption at Rest',
                                        desc: 'Lưu trữ toàn bộ thực thể SDLC, lịch sử RTM, bảng phân công RACI và chuỗi băm kiểm toán.'
                                    })}
                                    className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 cursor-pointer hover:shadow-md transition-all hover:border-emerald-400"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Relational DB</span>
                                        <Database className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <h5 className="font-bold text-sm mt-1">PostgreSQL 17 Cluster</h5>
                                    <p className="text-xs text-emerald-800 mt-1">Khóa cứng tính toàn vẹn dữ liệu • Partitioning</p>
                                </div>

                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Redis Distributed Cache',
                                        type: 'Container (In-Memory Cache)',
                                        tech: 'Redis 8.0 Cluster',
                                        zone: 'Internal Cache Tier',
                                        protocol: 'RESP3 over TLS',
                                        desc: 'Tăng tốc độ truy xuất KPI ma trận RTM, caching phiên làm việc và kiểm soát Rate Limit.'
                                    })}
                                    className="p-4 rounded-xl bg-rose-50/90 border border-rose-200 text-rose-900 cursor-pointer hover:shadow-md transition-all hover:border-rose-400"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">In-Memory Cache</span>
                                        <Cpu className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <h5 className="font-bold text-sm mt-1">Redis 8.0 Cluster</h5>
                                    <p className="text-xs text-rose-800 mt-1">Phản hồi dưới 2ms • Quản lý phiên làm việc</p>
                                </div>

                                <div 
                                    onClick={() => setSelectedNode({
                                        title: 'Apache Kafka Event Streams',
                                        type: 'Container (Event Broker)',
                                        tech: 'Apache Kafka 3.9 / Strimzi Operator',
                                        zone: 'Event Mesh Tier',
                                        protocol: 'Kafka Binary Protocol',
                                        desc: 'Xử lý các sự kiện phát hành, đồng bộ Webhook Git commit/PR và truyền phát chỉ số CI/CD.'
                                    })}
                                    className="p-4 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 cursor-pointer hover:shadow-md transition-all hover:border-purple-400"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">Event Mesh</span>
                                        <Layers className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <h5 className="font-bold text-sm mt-1">Kafka Event Bus</h5>
                                    <p className="text-xs text-purple-800 mt-1">Xử lý hàng đợi phát hành • Webhook Ingestion</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Node Inspector Drawer */}
            {selectedNode ? (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900">{selectedNode.title}</span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {selectedNode.type}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 max-w-2xl">{selectedNode.desc}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                            <span>Tech: <strong className="text-slate-700">{selectedNode.tech}</strong></span>
                            <span>•</span>
                            <span>Zone: <strong className="text-indigo-700">{selectedNode.zone}</strong></span>
                            <span>•</span>
                            <span>Protocol: <strong className="text-emerald-700">{selectedNode.protocol}</strong></span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedNode(null)}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-200/70 hover:bg-slate-300 text-slate-700 self-start sm:self-auto cursor-pointer"
                    >
                        Đóng chi tiết
                    </button>
                </div>
            ) : (
                <p className="text-[11px] text-slate-400 mt-3 text-center">
                    💡 Nhấp vào bất kỳ thành phần nào trên sơ đồ C4 để xem chi tiết kiến trúc, vùng bảo mật (Zone) và giao thức kết nối.
                </p>
            )}
        </div>
    );
}
