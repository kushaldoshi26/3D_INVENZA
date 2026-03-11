import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, CheckCircle, Clock, Package, BarChart3 } from 'lucide-react';

const Admin = () => {
    const [orders, setOrders] = useState([
        { id: 'ORD-7721', user: 'Kushal Doshi', total: 450, status: 'paid', files: ['bracket.stl'], date: '2026-02-05' },
        { id: 'ORD-7722', user: 'Rahul Sharma', total: 1200, status: 'printing', files: ['gear_box.stl'], date: '2026-02-05' },
    ]);

    return (
        <div className="container mx-auto px-6 py-32">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-bold">CONTROL CENTER</h2>
                    <p className="text-gray-500 font-tech text-xs tracking-[0.2em] mt-2">NEXUS PRODUCTION NODE // v2.4</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-panel px-6 py-3 rounded-xl border-white/5 flex items-center gap-3">
                        <BarChart3 className="text-brand-accent" size={18} />
                        <div>
                            <div className="text-[8px] text-gray-500 font-tech">DAILY REVENUE</div>
                            <div className="text-sm font-tech">₹14,200</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'PENDING', val: 12, icon: Clock },
                    { label: 'ACTIVE PRINTS', val: 4, icon: Package },
                    { label: 'DELIVERED', val: 156, icon: CheckCircle },
                    { label: 'FILAMENT LEFT', val: '4.2kg', icon: BarChart3 },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl border-white/5">
                        <stat.icon className="text-gray-600 mb-4" size={20} />
                        <div className="text-2xl font-tech">{stat.val}</div>
                        <div className="text-[10px] text-gray-500 font-tech mt-1 tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="glass-panel rounded-3xl border-white/5 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 font-tech text-[10px] text-gray-400 tracking-widest">
                            <th className="px-8 py-4">ORDER_ID</th>
                            <th className="px-8 py-4">CLIENT</th>
                            <th className="px-8 py-4">FILES</th>
                            <th className="px-8 py-4">REVENUE</th>
                            <th className="px-8 py-4">STATUS</th>
                            <th className="px-8 py-4">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {orders.map((order, i) => (
                            <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                                <td className="px-8 py-6 font-tech text-xs">{order.id}</td>
                                <td className="px-8 py-6">{order.user}</td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-2">
                                        {order.files.map((f, fi) => (
                                            <span key={fi} className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300">{f}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-6 font-tech">₹{order.total}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-tech ${order.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-3">
                                        <button className="p-2 hover:bg-brand-accent/20 rounded-md text-brand-accent transition-all">
                                            <Download size={16} />
                                        </button>
                                        <button className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-tech hover:bg-white/20">
                                            UPDATE
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;
