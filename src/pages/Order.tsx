import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Package, Calendar, User, Phone, School } from "lucide-react";

interface Order {
    id: string;
    name: string;
    email: string;
    phone: string;
    school: string;
    studentClass: string;
    section: string;
    message: string;
    submittedAt: string;
}

const Order = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                // ⚠️ Replace 'orders' with your actual collection name
                const q = query(collection(db, "orders"), orderBy("submittedAt", "desc"));
                const querySnapshot = await getDocs(q);
                const ordersData = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Order[];
                setOrders(ordersData);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Package className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-gray-900">
                                School <span className="text-primary">Orders</span>
                            </h1>
                            <p className="text-gray-500">View and manage all incoming meal enquiries</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 bg-white animate-pulse rounded-2xl border border-gray-100" />
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-gray-400 text-lg">No orders found yet. <br />Check your Firestore configuration or collection name.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {orders.map((order) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2 text-primary font-semibold">
                                            <Calendar size={16} />
                                            <span className="text-sm">{order.submittedAt}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <User size={18} className="text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-gray-900">{order.name}</p>
                                                <p className="text-sm text-gray-500">{order.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <Phone size={18} className="text-gray-400 mt-1" />
                                            <p className="text-gray-700 font-medium">{order.phone}</p>
                                        </div>

                                        <div className="flex items-start gap-3 pt-2 border-t border-gray-50">
                                            <School size={18} className="text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-gray-900">{order.school}</p>
                                                <p className="text-sm text-gray-500">
                                                    Class {order.studentClass} • Section {order.section}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-4 border-t border-gray-50">
                                            <p className="text-sm text-gray-400 uppercase tracking-widest font-bold mb-2">Message</p>
                                            <p className="text-gray-600 text-sm leading-relaxed italic">"{order.message}"</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default Order;
