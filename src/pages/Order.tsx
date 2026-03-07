import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, RefreshCw, PackageCheck, LayoutDashboard, Database, ChevronRight, FileText, FileJson, Printer, ChevronDown, Table as TableIcon, FileSpreadsheet } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Export Libraries
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Register Ag-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// --- Data Models ---
enum OrderStatus {
    pending = "pending",
    processing = "processing",
    delivered = "delivered",
    preparing = "preparing",
    outfordelivery = "outfordelivery",
    cancelled = "cancelled"
}

interface OrderItem {
    foodId: string;
    foodName: string;
    quantity: number;
    amount: number;
}

interface Order {
    id: string;
    userId: string;
    userName: string;
    childId?: string;
    schoolId?: string;
    staffId?: string; // Support for staff orders
    items: OrderItem[];
    miscItems: OrderItem[];
    totalAmount: number;
    orderDate: Date;
    status: OrderStatus;
}

interface CityData {
    id: string;
    name: string;
}

interface SectionData {
    id: string;
    name: string;
}

interface ClassData {
    id: string;
    name: string;
    sections: SectionData[];
}

interface SchoolData {
    id: string;
    name: string;
    address: string;
    cityId: string;
    classes: ClassData[];
}

interface ChildData {
    id: string;
    parentId: string;
    name: string;
    sectionId?: string;
}

interface ListingData {
    id: string;
    category?: string;
    title?: string;
    date?: any; // fulfillmentDate
    foodItemIds?: string[];
}

interface FoodItemData {
    id: string;
    name: string;
    categoryId: string;
}

interface CategoryData {
    id: string;
    name: string;
}

const Order = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [children, setChildren] = useState<ChildData[]>([]);
    const [cities, setCities] = useState<CityData[]>([]);
    const [listings, setListings] = useState<ListingData[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItemData[]>([]);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const gridRef = useRef<AgGridReact<any>>(null);

    const detailedOrders = useMemo(() => {
        return orders.map((order, index) => {
            const child = children.find(c => c.id === order.childId);
            const staffUser = users.find(u => u.id === (order as any).userId || u.id === (order as any).staffId);

            let school = schools.find(s => s.id === order.schoolId);
            let className = "N/A";
            let sectionName = "N/A";

            // If schoolId not on order, try finding it via child's section in ALL schools
            if (!school && child?.sectionId) {
                for (const s of schools) {
                    for (const cls of s.classes) {
                        const section = cls.sections.find(sec => sec.id === child.sectionId);
                        if (section) {
                            school = s;
                            className = cls.name;
                            sectionName = section.name;
                            break;
                        }
                    }
                    if (school) break;
                }
            }
            // If still no school, check if it's a staff order and get schoolId from user
            else if (!school && staffUser?.schoolId) {
                school = schools.find(s => s.id === staffUser.schoolId);
            }

            // Fallback for className/sectionName if school was found directly but they aren't set
            if (school && child?.sectionId && className === "N/A") {
                for (const cls of school.classes) {
                    const section = cls.sections.find(s => s.id === child.sectionId);
                    if (section) {
                        className = cls.name;
                        sectionName = section.name;
                        break;
                    }
                }
            }

            const city = cities.find(c => c.id === school?.cityId);
            const listing = listings.find(l => l.id === (order as any).listingId);

            // Format date as dd-mm-yyyy hh:mm AM/PM safely
            let formattedDate = "N/A";
            try {
                if (order.orderDate instanceof Date && !isNaN(order.orderDate.getTime())) {
                    const day = String(order.orderDate.getDate()).padStart(2, '0');
                    const month = String(order.orderDate.getMonth() + 1).padStart(2, '0');
                    const year = order.orderDate.getFullYear();

                    let hours = order.orderDate.getHours();
                    const minutes = String(order.orderDate.getMinutes()).padStart(2, '0');
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12; // the hour '0' should be '12'

                    formattedDate = `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
                }
            } catch (e) {
                console.error("❌ Date Format Error:", e);
            }

            // Format fulfillment date (Ordered For)
            let fulfillmentDateFormatted = "N/A";
            try {
                const fDate = listing?.date;
                if (fDate) {
                    const dateObj = fDate instanceof Timestamp ? fDate.toDate() : new Date(fDate);
                    if (!isNaN(dateObj.getTime())) {
                        const d = String(dateObj.getDate()).padStart(2, '0');
                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const y = dateObj.getFullYear();
                        fulfillmentDateFormatted = `${d}-${m}-${y}`;
                    }
                }
            } catch (e) {
                console.error("❌ Fulfillment Date Error:", e);
            }

            // Resolve Category Name: Iterate through all items in the order
            let categoryNames: string[] = [];
            try {
                const allItemIds = [
                    ...(order.items || []).map(i => i.foodId),
                    ...(order.miscItems || []).map(i => i.foodId)
                ];

                for (const foodId of allItemIds) {
                    const fItem = foodItems.find(fi => fi.id === foodId);
                    if (fItem) {
                        const cat = categories.find(c => c.id === fItem.categoryId);
                        if (cat && !categoryNames.includes(cat.name)) {
                            categoryNames.push(cat.name);
                        }
                    }
                }

                // If no categories found via items, try listing
                if (categoryNames.length === 0) {
                    const firstFoodItemId = listing?.foodItemIds?.[0];
                    if (firstFoodItemId) {
                        const fItem = foodItems.find(fi => fi.id === firstFoodItemId);
                        if (fItem) {
                            const cat = categories.find(c => c.id === fItem.categoryId);
                            if (cat) categoryNames.push(cat.name);
                        }
                    }
                }
            } catch (e) {
                console.error("❌ Category Resolve Error:", e);
            }
            const categoryLabel = categoryNames.length > 0 ? categoryNames.join(", ") : "N/A";

            const childIdVal = String(order.childId || "").trim();
            const isStaff = !!(
                (order as any).staffId ||
                !childIdVal ||
                childIdVal === "" ||
                childIdVal === "none" ||
                childIdVal === "N/A" ||
                childIdVal === "undefined" ||
                childIdVal === "null"
            );
            const staffLabel = "STAFF";

            // Diagnostic to see what's actually in these fields safely
            if (index < 5) {
                console.log(`🔍 Order ${order.id} | listingId: ${(order as any).listingId} | childId: ${order.childId} | schoolId: ${order.schoolId} | schoolFound: ${school?.name}`);
            }

            return {
                ...order,
                schoolName: school?.name || "N/A",
                childName: isStaff ? staffLabel : (child?.name || "N/A"),
                cityName: isStaff ? "" : (city?.name || "N/A"),
                className: isStaff ? "" : className,
                sectionName: isStaff ? "" : sectionName,
                formattedDate,
                fulfillmentDateFormatted,
                category: categoryLabel,
                orderedBy: order.userName || "N/A",
                fullItems: [...(order.items || []), ...(order.miscItems || [])].map(i => `${i?.foodName || "Unknown"} (x${i?.quantity || 0})`).join(", ")
            };
        });
    }, [orders, schools, children, cities]);

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(detailedOrders.map(o => ({
            OrderID: o.id,
            OrderDate: o.formattedDate,
            OrderedFor: o.fulfillmentDateFormatted,
            OrderedBy: o.orderedBy,
            Category: o.category,
            City: o.cityName,
            School: o.schoolName,
            Class: o.className,
            Section: o.sectionName,
            ChildName: o.childName,
            FoodItem: o.fullItems,
            Amount: o.totalAmount,
            Status: o.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, `hotkefood_orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text("Hotke Food - Advanced Order Report", 14, 15);

        const tableData = detailedOrders.map(o => [
            o.id,
            o.formattedDate,
            o.fulfillmentDateFormatted,
            o.orderedBy,
            o.category,
            o.cityName,
            o.schoolName,
            o.className,
            o.sectionName,
            o.childName,
            o.fullItems,
            o.totalAmount,
            o.status.toUpperCase()
        ]);

        autoTable(doc, {
            head: [['OrderId', 'OrderDate', 'OrderedFor', 'OrderedBy', 'Category', 'City', 'School', 'Class', 'Section', 'ChildName', 'FoodItem', 'Amount', 'Status']],
            body: tableData,
            startY: 25,
            theme: 'grid',
            headStyles: { fillColor: [255, 107, 0] },
            styles: { fontSize: 6.5 } // Slightly smaller font for more columns
        });

        doc.save(`hotkefood_orders_extended_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportJson = () => {
        const blob = new Blob([JSON.stringify(detailedOrders, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hotkefood_orders_detailed_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        console.log("🔍 SYNCING LIVE ORDER DATABASE & METADATA");
        setError(null);

        // Metadata Sync (Multi-case support)
        const syncMetadata = (names: string[], setter: any, label: string) => {
            return names.map(name => onSnapshot(collection(db, name), (snap) => {
                if (!snap.empty) {
                    console.log(`✅ [${name}] Metadata Sync: ${snap.size} records`);
                    setter((prev: any) => {
                        const newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        // Merge or replace based on logic (here we just replace if not empty)
                        return newData;
                    });
                } else {
                    console.log(`ℹ️ [${name}] Collection empty/restricted`);
                }
            }, (err) => console.error(`❌ ${label} [${name}] Error:`, err)));
        };

        const unsubsSchools = syncMetadata(["Schools", "schools"], setSchools, "Schools");
        const unsubsChildren = syncMetadata(["Children", "children"], setChildren, "Children");
        const unsubsCities = syncMetadata(["Cities", "cities"], setCities, "Cities");
        const unsubsListings = syncMetadata(["Listings", "listings"], setListings, "Listings");
        const unsubsFoodItems = syncMetadata(["FoodItems", "foodItems"], setFoodItems, "FoodItems");
        const unsubsCategories = syncMetadata(["Categories", "categories"], setCategories, "Categories");
        const unsubsUsers = syncMetadata(["Users", "users"], setUsers, "Users");

        // Robust Order Fetching
        let lastSyncSource = "";

        const tryFetch = (collName: string) => {
            const q = query(collection(db, collName), orderBy("orderDate", "desc"));

            return onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    console.log(`✅ [${collName}] Data detected (${snapshot.size} docs)`);
                    console.log("📄 SAMPLE DOC STRUCTURE:", snapshot.docs[0].data());
                    lastSyncSource = collName;
                    const ordersData = snapshot.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() :
                                (data.timestamp instanceof Timestamp ? data.timestamp.toDate() :
                                    (data.orderDate ? new Date(data.orderDate) : new Date())),
                        } as Order;
                    });
                    setOrders(ordersData);
                    setLoading(false);
                    setError(null);
                } else {
                    console.log(`ℹ️ [${collName}] Collection is empty or restricted`);
                    // If we previously had data from this source and now it's empty, update it
                    // But if we have data from another source, don't let an empty sync from a "wrong" collection name wipe it out
                    if (lastSyncSource === collName || !lastSyncSource) {
                        if (!lastSyncSource) setLoading(false);
                    }
                }
            }, (err) => {
                console.error(`❌ [${collName}] Error:`, err.message);
                if (!lastSyncSource) setError(err.message);
            });
        };

        const unsub1 = tryFetch("orders");
        const unsub2 = tryFetch("Orders");

        return () => {
            unsub1(); unsub2();
            unsubsSchools.forEach(u => u());
            unsubsChildren.forEach(u => u());
            unsubsCities.forEach(u => u());
            unsubsListings.forEach(u => u());
            unsubsFoodItems.forEach(u => u());
            unsubsCategories.forEach(u => u());
            unsubsUsers.forEach(u => u());
        };
    }, []);

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            field: "id",
            headerName: "OrderID",
            width: 140,
            minWidth: 140,
            cellClass: "font-mono text-[10px] text-slate-400 font-bold",
            pinned: 'left'
        },
        {
            field: "formattedDate",
            headerName: "ORDER DATE",
            width: 130,
            minWidth: 130,
            cellClass: "text-slate-400 font-bold text-xs"
        },
        {
            field: "fulfillmentDateFormatted",
            headerName: "ORDERED FOR",
            width: 130,
            minWidth: 130,
            cellClass: "text-primary font-bold text-xs"
        },
        {
            field: "orderedBy",
            headerName: "ORDERED BY",
            width: 150,
            minWidth: 150,
            cellClass: "font-medium text-slate-700"
        },
        {
            field: "category",
            headerName: "CATEGORY",
            width: 150,
            minWidth: 150,
            cellClass: "text-slate-500 uppercase font-black text-[10px]"
        },
        {
            field: "cityName",
            headerName: "CITY",
            width: 130,
            minWidth: 130,
            cellClass: "text-slate-400 uppercase tracking-tighter"
        },
        {
            field: "schoolName",
            headerName: "SCHOOL",
            width: 180,
            minWidth: 180,
            cellClass: "font-medium text-slate-600"
        },
        {
            field: "className",
            headerName: "CLASS",
            width: 110,
            minWidth: 110,
            cellClass: "text-slate-500 font-bold"
        },
        {
            field: "sectionName",
            headerName: "SECTION",
            width: 110,
            minWidth: 110,
            cellClass: "text-slate-500 font-bold"
        },
        {
            field: "childName",
            headerName: "CHILDNAME",
            width: 170,
            minWidth: 170,
            cellClass: "font-bold text-primary"
        },
        {
            headerName: "FOODITEM",
            flex: 1,
            minWidth: 300,
            field: "fullItems",
            cellClass: "text-slate-500 font-medium text-sm italic"
        },
        {
            field: "totalAmount",
            headerName: "AMOUNT",
            width: 120,
            minWidth: 120,
            valueFormatter: (params) => `₹${params.value?.toLocaleString()}`,
            cellClass: "font-mono font-black text-slate-900"
        },
        {
            field: "status",
            headerName: "STATUS",
            width: 150,
            minWidth: 150,
            cellRenderer: (params: any) => {
                const status = params.value?.toLowerCase();
                const colors: Record<string, string> = {
                    delivered: "bg-[#ECFDF5] text-[#059669] border-[#D1FAE5]",
                    processing: "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]",
                    preparing: "bg-[#F0F9FF] text-[#0ea5e9] border-[#E0F2FE]",
                    outfordelivery: "bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]",
                    cancelled: "bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]",
                    pending: "bg-[#F8FAFC] text-[#64748B] border-[#F1F5F9]",
                };
                return (
                    <div className="flex items-center justify-center h-full">
                        <div className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest border ${colors[status] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
                            {params.value}
                        </div>
                    </div>
                );
            }
        }
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable: true,
        filter: false,
        resizable: true,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        headerClass: 'center-header',
        cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center' as const,
            fontSize: '12px',
            color: '#334155'
        }
    }), []);

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-display selection:bg-primary/20">
            {/* NO NAVBAR FOR FULL-SCREEN DASHBOARD */}

            <main className="flex-grow flex flex-col overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow flex flex-col p-4 md:p-8 overflow-hidden"
                >
                    {/* MODERN ENTERPRISE HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white shadow-xl">
                                <LayoutDashboard size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 italic">SYSTEM STATUS: ACTIVE</p>
                                </div>
                                <h1 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tight">
                                    Order <span className="text-primary">Management</span>
                                </h1>
                                <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">Real-time sync with school database</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter records..."
                                    className="w-full md:w-80 pl-11 pr-4 h-14 border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium placeholder:text-slate-400"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="h-14 px-8 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-4 group border border-slate-900"
                                    >
                                        <Download size={18} /> Export <ChevronDown size={14} className="opacity-50 group-hover:translate-y-0.5 transition-transform" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-none border-2 border-slate-900 bg-white shadow-2xl">
                                    <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-3 h-12 px-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-none group transition-colors">
                                        <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Excel (.xlsx)</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToPdf} className="flex items-center gap-3 h-12 px-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-none group transition-colors">
                                        <FileText size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Document (PDF)</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportJson} className="flex items-center gap-3 h-12 px-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-none group transition-colors">
                                        <FileJson size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Data Object (JSON)</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                onClick={() => window.location.reload()}
                                className="h-14 w-14 border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* CLEAN GRID STAGE */}
                    <div className="flex-grow bg-white border border-slate-200 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] relative flex flex-col overflow-hidden">
                        <div className="ag-theme-alpine flex-grow w-full h-full pb-20 md:pb-0">
                            <AgGridReact
                                ref={gridRef}
                                rowData={detailedOrders}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                animateRows={true}
                                headerHeight={40}
                                rowHeight={38}
                                pagination={true}
                                paginationPageSize={20}
                                suppressCellFocus={true}
                                overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading orders...</span>'}
                                quickFilterText={searchText}
                                overlayNoRowsTemplate='<div class="empty-state">NO RECORDS FOUND</div>'
                            />
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* NO FOOTER FOR FULL-SCREEN DASHBOARD */}

            <style>{`
                @media print {
                  nav, footer { display: none !important; }
                }

                /* === AG-GRID ALPINE THEME OVERRIDES === */
                .ag-theme-alpine {
                    --ag-background-color: #ffffff;
                    --ag-odd-row-background-color: #fafafa;
                    --ag-header-background-color: #f1f5f9;
                    --ag-header-foreground-color: #475569;
                    --ag-header-cell-hover-background-color: #e8edf2;
                    --ag-row-hover-color: #f8fafc;
                    --ag-selected-row-background-color: #fff7ed;
                    --ag-font-size: 12px;
                    --ag-font-family: 'Inter', system-ui, sans-serif;
                    --ag-border-color: #e2e8f0;
                    --ag-row-border-color: #f1f5f9;
                    --ag-grid-size: 4px;
                    --ag-list-item-height: 30px;
                    --ag-cell-horizontal-padding: 8px;
                    border: 1px solid #e2e8f0;
                }

                /* === HEADER CENTERING & STYLING === */
                .ag-theme-alpine .ag-header {
                    border-bottom: 2px solid #e2e8f0;
                    font-weight: 700;
                }
                .ag-theme-alpine .ag-header-cell {
                    border-right: 1px solid #e2e8f0;
                }
                .ag-theme-alpine .ag-header-cell-label {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.07em !important;
                    color: #64748b !important;
                }

                /* === CELL STYLING === */
                .ag-theme-alpine .ag-cell {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-align: center !important;
                    border-right: 1px solid #f1f5f9 !important;
                    padding: 0 8px !important;
                }

                /* === ROW STYLING === */
                .ag-theme-alpine .ag-row {
                    border-bottom: 1px solid #f1f5f9 !important;
                    transition: background-color 0.1s ease;
                }
                .ag-theme-alpine .ag-row-hover {
                    background-color: #fff5f0 !important;
                    box-shadow: inset 3px 0 0 #FF6B00;
                }
                .ag-theme-alpine .ag-row-even {
                    background-color: #ffffff;
                }
                .ag-theme-alpine .ag-row-odd {
                    background-color: #fafbfc;
                }

                /* === SORT ICON CENTERING === */
                .ag-theme-alpine .ag-sort-indicator-container {
                    color: #94a3b8;
                }

                /* === PAGINATION BAR === */
                .ag-theme-alpine .ag-paging-panel {
                    border-top: 1px solid #e2e8f0;
                    font-size: 11px;
                    color: #64748b;
                    height: 40px;
                }

                /* === SCROLLBAR === */
                .ag-body-viewport::-webkit-scrollbar { width: 6px; height: 6px; }
                .ag-body-viewport::-webkit-scrollbar-track { background: #f8fafc; }
                .ag-body-viewport::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
                .ag-body-viewport::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default Order;
