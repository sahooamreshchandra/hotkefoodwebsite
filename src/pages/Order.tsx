import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, RefreshCw, PackageCheck, LayoutDashboard, Database, ChevronRight, FileText, FileJson, Printer, ChevronDown, Table as TableIcon, FileSpreadsheet, ShieldAlert, ShieldCheck, Lock } from "lucide-react";
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

// Assets
import logo from "../assets/logo.png";

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
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(false); // Start locked
    const [enteredKey, setEnteredKey] = useState("");
    const gridRef = useRef<AgGridReact<any>>(null);

    const handleVerify = () => {
        const secretGuid = import.meta.env.VITE_ORDER_PAGE_ACCESS_KEY;
        if (!secretGuid || enteredKey === secretGuid) {
            setIsAuthorized(true);
        } else {
            alert("❌ Invalid Access Key");
            setEnteredKey("");
        }
    };

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
                /* silent fail */
            }

            // Format fulfillment date (Ordered For)
            let fulfillmentDateFormatted = "N/A";
            try {
                // Priority: order.miscDate (for misc orders) then listing.date (for listing orders)
                const fDate = (order as any).miscDate || listing?.date;
                if (fDate) {
                    const dateObj = fDate instanceof Timestamp ? fDate.toDate() : new Date(fDate);
                    if (!isNaN(dateObj.getTime())) {
                        const d = String(dateObj.getDate()).padStart(2, '0');
                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const y = dateObj.getFullYear();
                        fulfillmentDateFormatted = `${d}-${m}-${y}`;
                        (order as any).rawFulfillmentDate = dateObj; // Store for filtering
                    }
                }
            } catch (e) {
                /* silent fail */
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
                /* silent fail */
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
        if (!gridRef.current?.api) return;

        const filteredData: any[] = [];
        gridRef.current.api.forEachNodeAfterFilter((node) => {
            if (node.data) filteredData.push(node.data);
        });

        const worksheet = XLSX.utils.json_to_sheet(filteredData.map(o => ({
            OrderDate: o.formattedDate,
            OrderedFor: o.fulfillmentDateFormatted,
            City: o.cityName,
            School: o.schoolName,
            Category: o.category,
            FoodItem: o.fullItems,
            OrderedBy: o.orderedBy,
            ChildName: o.childName,
            Class: o.className,
            Section: o.sectionName,
            Amount: o.totalAmount,
            Status: o.status
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, `hotkefood_orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = () => {
        try {
            if (!gridRef.current?.api) return;

            const filteredData: any[] = [];
            gridRef.current.api.forEachNodeAfterFilter((node) => {
                if (node.data) filteredData.push(node.data);
            });


            const doc = new jsPDF('l', 'mm', 'a4');
            const totalAmount = filteredData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const primaryOrange = [255, 107, 0] as [number, number, number];

            // Branding - 'hotkefood' (lowercase, single word)
            doc.setFontSize(26);
            doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
            doc.setFont("helvetica", "bold");
            doc.text("hotkefood", 14, 18);

            // Report Title
            doc.setFontSize(10);
            doc.setTextColor(51, 65, 85);
            doc.text("OFFICIAL ORDER MANAGEMENT REPORT (ALL DETAILS)", 14, 24);

            // Decorative Line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 27, 283, 27);

            // Stats Summary
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            doc.text(`Visible Records: ${filteredData.length}`, 14, 34);
            doc.text(`Filtered Collection: Rs. ${totalAmount.toLocaleString()}`, 14, 38);
            doc.text(`Report Generated: ${new Date().toLocaleString()}`, 210, 38);

            // DATA MAPPING
            const tableData = filteredData.map(o => [
                String(o.formattedDate || ""),
                String(o.fulfillmentDateFormatted || ""),
                String(o.cityName || "N/A"),
                String(o.schoolName || ""),
                String(o.category || ""),
                String(o.fullItems || ""),
                String(o.orderedBy || ""),
                String(o.childName || ""),
                String(o.className || "N/A"),
                String(o.sectionName || "N/A"),
                String(o.totalAmount || 0),
                String(o.status || "").toUpperCase()
            ]);

            autoTable(doc, {
                head: [['OrderDate', 'OrderedFor', 'City', 'School', 'Category', 'FoodItem', 'OrderedBy', 'ChildName', 'Class', 'Section', 'Amount', 'Status']],
                body: tableData,
                startY: 42,
                theme: 'grid',
                tableWidth: 'auto',
                headStyles: {
                    fillColor: primaryOrange,
                    textColor: [255, 255, 255],
                    fontSize: 7.5,
                    fontStyle: 'bold',
                    halign: 'center',
                    valign: 'middle'
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2,
                    valign: 'middle',
                    halign: 'center',
                    lineColor: [226, 232, 240],
                    lineWidth: 0.1,
                    overflow: 'linebreak'
                },
                columnStyles: {
                    9: { halign: 'center' }
                },
                didDrawPage: (data) => {
                    const str = "Page " + doc.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(100, 116, 139);
                    doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
                }
            });


            doc.save(`HOTKE_DETAILS_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            /* silent fail */
            alert("Export Error: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    const exportToLabels = () => {
        try {
            if (!gridRef.current?.api) return;
            const filteredData: any[] = [];
            gridRef.current.api.forEachNodeAfterFilter((node) => {
                if (node.data) filteredData.push(node.data);
            });

            if (!filteredData.length) return;

            const doc = new jsPDF('p', 'mm', 'a4');
            const primaryOrange = [255, 107, 0] as [number, number, number];
            const pageW = 210;
            const pageH = 297;
            const cols = 2;
            const rows = 5;
            const labelW = pageW / cols - 10;
            const labelH = pageH / rows - 8;
            const marginX = 5;
            const marginY = 5;

            filteredData.forEach((o, idx) => {
                const posOnPage = idx % (cols * rows);
                const col = posOnPage % cols;
                const row = Math.floor(posOnPage / cols);

                if (idx > 0 && posOnPage === 0) doc.addPage();

                const x = marginX + col * (labelW + 10);
                const y = marginY + row * (labelH + 8);

                // Label box
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.roundedRect(x, y, labelW, labelH, 3, 3);

                // Brand header
                doc.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
                doc.roundedRect(x, y, labelW, 10, 3, 3, 'F');
                doc.rect(x, y + 5, labelW, 5, 'F'); // bottom-flat
                doc.setFontSize(9);
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.text('hotkefood', x + 3, y + 7);
                doc.setFontSize(6);
                doc.text(o.fulfillmentDateFormatted || "", x + labelW - 3, y + 7, { align: 'right' });

                // Content
                doc.setTextColor(30, 30, 30);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text(o.childName || '—', x + 3, y + 17);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(80, 80, 80);
                const school = o.schoolName && o.schoolName !== 'N/A' ? o.schoolName : '';
                const clsSec = [o.className, o.sectionName].filter((v: string) => v && v !== 'N/A' && v !== '').join(' / ');
                if (school) doc.text(school, x + 3, y + 23);
                if (clsSec) doc.text(clsSec, x + 3, y + 28);
                if (o.cityName && o.cityName !== 'N/A' && o.cityName !== '') doc.text(`${o.cityName}`, x + 3, y + 33);

                // Meal
                doc.setFillColor(245, 245, 245);
                doc.rect(x + 2, y + 36, labelW - 4, 10, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
                doc.text(`${o.fullItems}`, x + 4, y + 43, { maxWidth: labelW - 8 });
            });

            doc.save(`hotkefood_order_labels_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            /* silent fail */
            alert("Label Export Error: " + (err instanceof Error ? err.message : String(err)));
        }
    };

    // Removed exportJson as requested

    useEffect(() => {
        /* silent fail */
        setError(null);

        // Metadata Sync (Multi-case support)
        const syncMetadata = (names: string[], setter: any, label: string) => {
            return names.map(name => onSnapshot(collection(db, name), (snap) => {
                if (!snap.empty) {

                    setter((prev: any) => {
                        const newData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        // Merge or replace based on logic (here we just replace if not empty)
                        return newData;
                    });
                } else {

                }
            }, (err) => { /* silent fail */ }));
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

                    // If we previously had data from this source and now it's empty, update it
                    // But if we have data from another source, don't let an empty sync from a "wrong" collection name wipe it out
                    if (lastSyncSource === collName || !lastSyncSource) {
                        if (!lastSyncSource) setLoading(false);
                    }
                }
            }, (err) => {
                /* silent fail */
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
            field: "orderDate",
            headerName: "ORDER DATE",
            cellClass: "text-slate-400 font-medium text-[11px]",
            filter: 'agDateColumnFilter',
            floatingFilter: true,
            filterParams: {
                comparator: (filterLocalDateAtMidnight: Date, cellValue: Date) => {
                    if (cellValue == null) return -1;
                    const cellDate = new Date(cellValue.getTime());
                    cellDate.setHours(0, 0, 0, 0);
                    const filterDate = new Date(filterLocalDateAtMidnight.getTime());
                    filterDate.setHours(0, 0, 0, 0);

                    if (cellDate < filterDate) return -1;
                    if (cellDate > filterDate) return 1;
                    return 0;
                }
            },
            valueFormatter: (params) => {
                const date = params.value;
                if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                let hours = date.getHours();
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
            }
        },
        {
            field: "rawFulfillmentDate",
            headerName: "ORDERED FOR",
            cellClass: "text-orange-600 font-bold text-[11px]",
            filter: 'agDateColumnFilter',
            floatingFilter: true,
            filterParams: {
                comparator: (filterLocalDateAtMidnight: Date, cellValue: Date) => {
                    if (cellValue == null) return -1;
                    const cellDate = new Date(cellValue.getTime());
                    cellDate.setHours(0, 0, 0, 0);
                    const filterDate = new Date(filterLocalDateAtMidnight.getTime());
                    filterDate.setHours(0, 0, 0, 0);

                    if (cellDate < filterDate) return -1;
                    if (cellDate > filterDate) return 1;
                    return 0;
                }
            },
            valueFormatter: (params) => {
                const date = params.value;
                if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const y = date.getFullYear();
                return `${d}-${m}-${y}`;
            }
        },
        {
            field: "cityName",
            headerName: "CITY",
            cellClass: "text-slate-400 font-medium tracking-wide text-[11px] uppercase",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "schoolName",
            headerName: "SCHOOL",
            cellClass: "font-medium text-slate-700 text-[12px]",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "category",
            headerName: "CATEGORY",
            cellClass: "text-slate-500 font-black text-[10px] uppercase",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            headerName: "FOODITEM",
            flex: 1,
            field: "fullItems",
            cellClass: "text-slate-500 font-medium text-[11px] italic leading-tight",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "orderedBy",
            headerName: "ORDERED BY",
            cellClass: "font-semibold text-slate-800 text-[12px]",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "childName",
            headerName: "CHILDNAME",
            cellClass: "font-black text-primary text-[13px] uppercase tracking-tight",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "className",
            headerName: "CLASS",
            cellClass: "text-slate-600 font-bold text-[12px]",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "sectionName",
            headerName: "SECTION",
            cellClass: "text-slate-600 font-bold text-[12px]",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "totalAmount",
            headerName: "AMOUNT",
            valueFormatter: (params) => `₹${params.value?.toLocaleString()}`,
            cellClass: "font-mono font-black text-slate-900 text-[14px]",
            filter: 'agNumberColumnFilter',
            floatingFilter: true
        },
        {
            field: "id",
            headerName: "ORDER ID",
            cellClass: "font-mono text-[10px] text-slate-500 font-bold tracking-tight",
            filter: 'agTextColumnFilter',
            floatingFilter: true
        },
        {
            field: "status",
            headerName: "STATUS",
            cellRenderer: (params: any) => {
                const status = params.value?.toLowerCase();
                const colors: any = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    processing: "bg-blue-50 text-blue-700 border-blue-200",
                };
                return (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                        {status || 'Unknown'}
                    </div>
                );
            },
            filter: 'agTextColumnFilter',
            floatingFilter: true
        }
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 300, // USER REQUIREMENT: Extremely breathable columns
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        headerClass: 'center-header',
        floatingFilterComponentParams: {
            suppressFilterButton: true
        },
        cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
        }
    }), []);

    if (isAuthorized === false && import.meta.env.VITE_ORDER_PAGE_ACCESS_KEY) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center font-display p-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-slate-800 p-12 text-center shadow-2xl relative"
                >
                    <div className="w-20 h-20 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8 rounded-full border border-primary/20">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Terminal Locked</h2>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        This environment is protected. Please enter your administrator access key to continue.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Security GUID..."
                            className="w-full bg-slate-950 border border-slate-800 h-14 px-6 text-white text-center font-mono tracking-widest focus:outline-none focus:border-primary transition-all text-lg"
                            value={enteredKey}
                            onChange={(e) => setEnteredKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            autoFocus
                        />
                        <button
                            onClick={handleVerify}
                            className="w-full bg-primary hover:bg-orange-600 h-14 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                        >
                            Verify Access
                        </button>
                    </div>

                    <div className="pt-12 mt-8 border-t border-slate-800">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600 italic">hotkefood security gateway v2.1</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-display selection:bg-primary/20">
            {/* NO NAVBAR FOR FULL-SCREEN DASHBOARD */}

            <main className="flex-grow flex flex-col overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow flex flex-col p-4 md:p-8 overflow-hidden"
                >
                    {/* modern enterprise header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white flex items-center justify-center p-2 shadow-xl border border-slate-100">
                                <img src={logo} alt="hotkefood" className="w-full h-full object-contain" />
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
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Document (PDF) - All Details</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToLabels} className="flex items-center gap-3 h-12 px-4 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 rounded-none group transition-colors">
                                        <Printer size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-900">Document (PDF) - Lunch Box Labels</span>
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
                                rowHeight={40}
                                headerHeight={44}
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

            <style>{`
                @media print {
                  nav, footer { display: none !important; }
                }

                .ag-theme-alpine {
                    --ag-background-color: #ffffff;
                    --ag-odd-row-background-color: #fafbfc;
                    --ag-header-background-color: #f8fafc;
                    --ag-header-foreground-color: #0f172a;
                    --ag-header-cell-hover-background-color: #f1f5f9;
                    --ag-row-hover-color: #fffaf5;
                    --ag-selected-row-background-color: #fff7ed;
                    --ag-font-size: 13px;
                    --ag-font-family: 'Inter', system-ui, sans-serif;
                    --ag-border-color: #e2e8f0;
                    --ag-row-border-color: #f1f5f9;
                    --ag-grid-size: 4px;
                    --ag-header-column-separator-display: block;
                    --ag-header-column-separator-height: 40%;
                    --ag-header-column-separator-color: #cbd5e1;
                    border: 1px solid #e2e8f0;
                }

                .ag-theme-alpine .ag-header-cell {
                    padding: 0 !important;
                    background: #f1f5f9;
                    border-right: 1px solid #e2e8f0 !important;
                }
                .ag-theme-alpine .ag-header-cell-comp-wrapper {
                   display: flex;
                   flex-direction: column;
                }
                .ag-theme-alpine .ag-header-cell-label {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    width: 100% !important;
                    padding: 0 !important;
                    font-weight: 800 !important;
                    font-size: 10px !important;
                    color: #1e293b !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                }
                .ag-header-cell-text {
                    text-align: center !important;
                    width: 100% !important;
                }

                .ag-theme-alpine .ag-floating-filter {
                    padding: 4px 8px !important;
                    background: #f8fafc;
                }
                .ag-theme-alpine .ag-floating-filter-input input {
                    text-align: center !important;
                    font-size: 11px !important;
                    border: 1px solid #e2e8f0 !important;
                    background: white !important;
                    border-radius: 4px !important;
                }
                .ag-theme-alpine .ag-floating-filter-input input::placeholder {
                    color: transparent !important;
                }

                .ag-theme-alpine .ag-cell {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-align: center !important;
                    padding: 0 !important;
                    border-right: 1px solid #f1f5f9 !important;
                }

                .ag-theme-alpine .ag-row {
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .ag-theme-alpine .ag-row-odd { background-color: #fafbfc; }
                .ag-theme-alpine .ag-row-even { background-color: #ffffff; }


                .ag-body-viewport::-webkit-scrollbar { width: 8px; height: 8px; }
                .ag-body-viewport::-webkit-scrollbar-track { background: #f8fafc; }
                .ag-body-viewport::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .ag-body-viewport::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default Order;
