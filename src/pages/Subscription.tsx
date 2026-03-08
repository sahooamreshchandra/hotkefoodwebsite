import { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, RefreshCw, LayoutDashboard, ChevronDown, FileText, FileSpreadsheet, Lock, CheckCircle2, Calendar as CalendarIcon, User, GraduationCap, MapPin, Package } from "lucide-react";
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

// Assets
import logo from "../assets/logo.png";

// Register Ag-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// --- Data Models ---
interface UserSubscription {
    id: string;
    userId: string;
    childId?: string;
    staffId?: string;
    planId: string;
    status: "active" | "expired" | "cancelled";
    startDate: any;
    mealsDelivered: number;
    mealsRemaining: number;
    mealSelections: Record<string, Record<string, string>>; // { "YYYY-MM-DD": { "catId": "itemId" } }
    dailyStatus?: Record<string, string>;
    _collection?: string;
}

interface ChildData {
    id: string;
    name: string;
    schoolId?: string;
    sectionId?: string;
    classId?: string;
}

interface UserData {
    id: string;
    name: string;
    schoolId?: string;
}

interface FoodItemData {
    id: string;
    name: string;
}

interface SchoolData {
    id: string;
    name: string;
    cityId?: string;
    classes: any[];
}

const Subscription = () => {
    const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
    const [children, setChildren] = useState<ChildData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [foodItems, setFoodItems] = useState<FoodItemData[]>([]);
    const [schools, setSchools] = useState<SchoolData[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState("");
    const [searchText, setSearchText] = useState("");
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(false);
    const [enteredKey, setEnteredKey] = useState("");
    const gridRef = useRef<AgGridReact<any>>(null);

    const handleVerify = () => {
        const secretGuid = import.meta.env.VITE_SUBSCRIPTION_PAGE_ACCESS_KEY;
        if (!secretGuid || enteredKey === secretGuid) {
            setIsAuthorized(true);
        } else {
            alert("❌ Invalid Access Key");
            setEnteredKey("");
        }
    };

    const getFilteredRows = () => {
        const rows: any[] = [];
        if (gridRef.current?.api) {
            gridRef.current.api.forEachNodeAfterFilter((node) => {
                if (node.data) rows.push(node.data);
            });
        }
        return rows;
    };

    const exportToExcel = () => {
        const filteredData = getFilteredRows();
        if (!filteredData.length) return;
        const worksheet = XLSX.utils.json_to_sheet(filteredData.map(o => ({
            Date: o.displayDate,
            Name: o.childName,
            City: o.cityName,
            School: o.schoolName,
            Class: o.className,
            Section: o.sectionName,
            Meal: o.mealName,
            Status: o.status,
            Progress: o.progress
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Subscriptions");
        XLSX.writeFile(workbook, `hotkefood_subscriptions_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPdf = () => {
        try {
            const filteredData = getFilteredRows();
            if (!filteredData.length) return;
            const doc = new jsPDF('l', 'mm', 'a4');
            const primaryOrange = [255, 107, 0] as [number, number, number];
            doc.setFontSize(22);
            doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
            doc.text("hotkefood", 14, 16);
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);
            doc.text(`SUBSCRIPTION DELIVERY REPORT — ${new Date().toLocaleDateString('en-IN')}`, 14, 23);
            autoTable(doc, {
                head: [['Date', 'Name', 'City', 'School', 'Class', 'Section', 'Meal', 'Status', 'Progress']],
                body: filteredData.map(o => [
                    o.displayDate, o.childName, o.cityName, o.schoolName,
                    o.className, o.sectionName, o.mealName, o.status.toUpperCase(), o.progress
                ]),
                startY: 28,
                theme: 'grid',
                headStyles: { fillColor: primaryOrange, fontSize: 7, fontStyle: 'bold' },
                styles: { fontSize: 7, cellPadding: 2 }
            });
            doc.save(`hotkefood_subscriptions_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) { console.error("PDF Export Error:", err); }
    };

    const exportToPdfLabel = () => {
        try {
            const filteredData = getFilteredRows();
            if (!filteredData.length) return;
            // A5 label: 148 x 210 mm, portrait, 2 labels per page
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
                const pageIdx = Math.floor(idx / (cols * rows));
                const posOnPage = idx % (cols * rows);
                const col = posOnPage % cols;
                const row = Math.floor(posOnPage / cols);

                if (idx > 0 && posOnPage === 0) doc.addPage();
                if (pageIdx === 0 && posOnPage === 0) { /* first page already exists */ }

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
                doc.text(o.displayDate, x + labelW - 3, y + 7, { align: 'right' });

                // Content
                doc.setTextColor(30, 30, 30);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text(o.childName || '—', x + 3, y + 17);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(80, 80, 80);
                const school = o.schoolName !== '—' ? `${o.schoolName}` : '';
                const clsSec = [o.className, o.sectionName].filter((v: string) => v && v !== '—').join(' / ');
                if (school) doc.text(school, x + 3, y + 23);
                if (clsSec) doc.text(clsSec, x + 3, y + 28);
                if (o.cityName && o.cityName !== '—') doc.text(`${o.cityName}`, x + 3, y + 33);

                // Meal
                doc.setFillColor(245, 245, 245);
                doc.rect(x + 2, y + 36, labelW - 4, 10, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
                doc.text(`${o.mealName}`, x + 4, y + 43);
            });

            doc.save(`hotkefood_labels_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) { console.error("Label Export Error:", err); }
    };

    const deliveryList = useMemo(() => {
        const flattenedRows: any[] = [];

        userSubscriptions.forEach(sub => {
            if (sub.status !== "active") return;

            // Determine if it's a child or staff subscription
            const isStaff = !!sub.staffId;
            const child = !isStaff && sub.childId ? children.find(c => c.id === sub.childId) : null;
            const user = users.find(u => u.id === sub.userId);

            const childName = child?.name || user?.name || sub.staffId || "Unknown User";

            // School / City / Class / Section — only resolve for children, leave empty for staff
            let schoolName = "—";
            let cityName = "—";
            let className = "—";
            let sectionName = "—";

            if (!isStaff && child) {
                // Mirror Order.tsx's proven resolution: search by sectionId across all schools
                let school = schools.find(s => s.id === (child as any).schoolId);
                let resolvedClass = "—";
                let resolvedSection = "—";

                // If no direct schoolId, find via child.sectionId across ALL schools (proven Order pattern)
                if (!school && child.sectionId) {
                    for (const s of schools) {
                        for (const cls of (s.classes || [])) {
                            const section = (cls.sections || []).find((sec: any) => sec.id === child.sectionId);
                            if (section) {
                                school = s;
                                resolvedClass = cls.name;
                                resolvedSection = section.name;
                                break;
                            }
                        }
                        if (school) break;
                    }
                }

                // Fallback: resolve class/section if school was found directly but class/section not yet set
                if (school && child.sectionId && resolvedClass === "—") {
                    for (const cls of (school.classes || [])) {
                        const section = (cls.sections || []).find((sec: any) => sec.id === child.sectionId);
                        if (section) {
                            resolvedClass = cls.name;
                            resolvedSection = section.name;
                            break;
                        }
                    }
                }

                if (school) {
                    schoolName = school.name;
                    className = resolvedClass;
                    sectionName = resolvedSection;
                    const city = cities.find(c => c.id === (school as any).cityId);
                    if (city) cityName = city.name;
                }

                console.log(`🔍 Child [${child.id}] sectionId=${child.sectionId} → school=${schoolName} class=${className} section=${sectionName} city=${cityName}`);
            }

            const progress = `${sub.mealsDelivered ?? 0} / ${(sub.mealsDelivered ?? 0) + (sub.mealsRemaining ?? 0)}`;

            // Determine which dates to show
            const datesToShow = selectedDate
                ? [selectedDate]
                : Object.keys(sub.mealSelections || {}).sort();

            datesToShow.forEach(date => {
                const daySelections = sub.mealSelections?.[date] || {};
                // Status: use dailyStatus if set, otherwise 'processing'
                const rawStatus = sub.dailyStatus?.[date];
                const statusForDay = rawStatus || "processing";

                // If filtering by date and no selections for that day, skip
                if (selectedDate && Object.keys(daySelections).length === 0) return;

                // Format display date DD-MM-YYYY
                const dateParts = date.split('-');
                const displayDate = dateParts.length === 3
                    ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
                    : date;

                const mealEntries = Object.entries(daySelections); // [ [catId, itemId], ... ]

                if (mealEntries.length === 0) {
                    // No meal selections yet — still show row with 'processing'
                    flattenedRows.push({
                        id: `${sub.id}_${date}_empty`,
                        subId: sub.id,
                        date,
                        displayDate,
                        childName,
                        cityName,
                        schoolName,
                        className,
                        sectionName,
                        mealName: "No meal selected",
                        progress,
                        status: statusForDay
                    });
                } else {
                    // One row per meal item
                    mealEntries.forEach(([_catId, itemId], mealIdx) => {
                        const item = foodItems.find(fi => fi.id === itemId);
                        const mealName = item?.name || itemId;
                        flattenedRows.push({
                            id: `${sub.id}_${date}_${mealIdx}`,
                            subId: sub.id,
                            date,
                            displayDate,
                            childName,
                            cityName,
                            schoolName,
                            className,
                            sectionName,
                            mealName,
                            progress,
                            status: statusForDay
                        });
                    });
                }
            });
        });

        // Sort: newest date first, then by name
        return flattenedRows.sort((a, b) => {
            const dateCmp = b.date.localeCompare(a.date);
            if (dateCmp !== 0) return dateCmp;
            return a.childName.localeCompare(b.childName);
        });
    }, [userSubscriptions, children, users, foodItems, schools, cities, selectedDate]);

    useEffect(() => {
        const unsubs: any[] = [];
        let hasResolvedSubs = false;

        const sync = (names: string[], setter: any, label: string) => {
            names.forEach(name => {
                const unsub = onSnapshot(collection(db, name), (snap) => {
                    console.log(`📡 [${name}] Update: ${snap.empty ? 'empty' : snap.size + ' records'}`);

                    if (!snap.empty) {
                        const data = snap.docs.map(d => ({ id: d.id, _collection: name, ...d.data() }));
                        setter((prev: any) => {
                            const newIds = new Set(data.map((i: any) => i.id));
                            const others = prev.filter((i: any) => !newIds.has(i.id));
                            return [...others, ...data];
                        });
                    }

                    // Resolve loading
                    if (name.toLowerCase().includes("sub") && !hasResolvedSubs) {
                        hasResolvedSubs = true;
                        setLoading(false);
                    }
                }, (err) => {
                    console.error(`❌ ${label} [${name}] Error:`, err);
                    if (name.toLowerCase().includes("sub") && !hasResolvedSubs) {
                        setLoading(false);
                    }
                });
                unsubs.push(unsub);
            });
        };

        sync(["user_subscriptions", "UserSubscriptions", "UserSubscription", "user_subscription", "userSubscriptions", "subscriptions", "Subscription"], setUserSubscriptions, "Subscriptions");
        sync(["Children", "children", "childs"], setChildren, "Children");
        sync(["Users", "users"], setUsers, "Users");
        sync(["FoodItems", "foodItems", "food_items", "FoodItem"], setFoodItems, "FoodItems");
        sync(["Schools", "schools"], setSchools, "Schools");
        sync(["Cities", "cities"], setCities, "Cities");

        // Fallback for loading after 5s
        const timeout = setTimeout(() => {
            if (!hasResolvedSubs) {
                setLoading(false);
                hasResolvedSubs = true;
            }
        }, 5000);

        return () => {
            unsubs.forEach(u => u());
            clearTimeout(timeout);
        };
    }, []);

    // Diagnostic log in separate effect to track state changes
    useEffect(() => {
        if (!loading) {
            console.log("📊 SUBSCRIPTION PAGE STATE:");
            console.log("- Selected Date:", selectedDate);
            console.log("- Total Subscriptions:", userSubscriptions.length);
            console.log("- Children Data:", children.length);
            console.log("- Users Data:", users.length);
            console.log("- Food Items:", foodItems.length);
            console.log("- Schools:", schools.length);
            console.log("- Filtered Delivery List:", deliveryList.length);

            if (userSubscriptions.length > 0 && deliveryList.length === 0) {
                console.log("⚠️ Data loaded but filtered list is empty. Sample sub for debug:", userSubscriptions[0]);
                console.log("   Checking for date keys in mealSelections:", Object.keys(userSubscriptions[0].mealSelections || {}));
            }
        }
    }, [userSubscriptions, children, users, foodItems, schools, selectedDate, loading, deliveryList.length]);

    const columnDefs = useMemo<ColDef[]>(() => [
        {
            field: "displayDate",
            headerName: "DATE",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "font-black text-slate-900",
            cellRenderer: (params: any) => (
                <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-primary" />
                    <span>{params.value || "—"}</span>
                </div>
            )
        },
        {
            field: "childName",
            headerName: "NAME",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "font-black text-primary text-[13px] uppercase tracking-tight"
        },
        {
            field: "cityName",
            headerName: "CITY",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "text-slate-500 font-semibold tracking-wide text-[11px] uppercase"
        },
        {
            field: "schoolName",
            headerName: "SCHOOL",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "font-medium text-slate-700 text-[12px]"
        },
        {
            field: "className",
            headerName: "CLASS",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "text-slate-600 font-bold text-[12px]"
        },
        {
            field: "sectionName",
            headerName: "SECTION",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellClass: "text-slate-600 font-bold text-[12px]"
        },
        {
            field: "mealName",
            headerName: "MEAL ITEM",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            flex: 2,
            cellClass: "font-bold text-primary italic",
            cellRenderer: (params: any) => (
                <div className="flex items-center gap-2">
                    <Package size={14} className="opacity-50 shrink-0" />
                    <span>{params.value}</span>
                </div>
            )
        },
        {
            field: "status",
            headerName: "STATUS",
            filter: 'agTextColumnFilter',
            floatingFilter: true,
            cellRenderer: (params: any) => {
                const status = (params.value || "processing").toLowerCase();
                const config: any = {
                    delivered: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "DELIVERED" },
                    skipped: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", label: "SKIPPED" },
                    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "PENDING" },
                    processing: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", label: "PROCESSING" }
                };
                const s = config[status] || config.processing;
                return (
                    <div className={`${s.bg} ${s.text} ${s.border} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border`}>
                        {s.label}
                    </div>
                );
            }
        },
        { field: "progress", headerName: "PROGRESS", cellClass: "font-mono text-slate-500 text-[10px]", filter: 'agTextColumnFilter', floatingFilter: true }
    ], []);

    const defaultColDef = useMemo<ColDef>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 300,
        headerClass: 'center-header',
        floatingFilterComponentParams: {
            suppressFilterButton: true
        },
        cellStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
        }
    }), []);

    if (isAuthorized === false && import.meta.env.VITE_SUBSCRIPTION_PAGE_ACCESS_KEY) {
        return (
            <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center font-display p-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-12 text-center shadow-2xl relative"
                >
                    <div className="w-20 h-20 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8 rounded-full border border-primary/20">
                        <Lock size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Subscription Access</h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                        Enter your subscription management portal access key to continue.
                    </p>

                    <div className="space-y-4">
                        <input
                            type="password"
                            placeholder="Enter Security GUID..."
                            className="w-full bg-neutral-950 border border-neutral-800 h-14 px-6 text-white text-center font-mono tracking-widest focus:outline-none focus:border-primary transition-all text-lg"
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

                    <div className="pt-12 mt-8 border-t border-neutral-800">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600 italic">hotkefood security gateway v3.0</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-50 flex flex-col overflow-hidden font-display selection:bg-primary/20">
            <main className="flex-grow flex flex-col overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow flex flex-col p-4 md:p-8 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8 pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-white flex items-center justify-center p-2 shadow-2xl border border-slate-100 rounded-xl">
                                <img src={logo} alt="hotkefood" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Live Portal</p>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <h1 className="text-4xl font-display font-black text-slate-900 uppercase tracking-tighter flex items-center gap-1">
                                    <span className="text-primary">Delivery</span>
                                    <span>Manager</span>
                                </h1>
                                <p className="text-slate-400 text-[10px] font-bold mt-1.5 uppercase tracking-widest flex items-center gap-2">
                                    {selectedDate ? (
                                        <>Requirements for <span className="text-slate-900">{selectedDate}</span></>
                                    ) : (
                                        "Unified Subscription & Delivery Schedule"
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SEARCH DATABASE..."
                                    className="pl-11 pr-4 h-14 w-64 border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-xs font-black uppercase tracking-tighter"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                                <input
                                    type="date"
                                    className="pl-11 pr-4 h-14 border border-slate-200 bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm font-black uppercase tracking-tighter"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="h-14 px-6 border border-slate-200 bg-white text-slate-600 hover:text-primary hover:border-primary transition-all flex items-center gap-3 shadow-sm group">
                                        <Download size={18} className="group-hover:translate-y-1 transition-transform" />
                                        <span className="text-xs font-black uppercase tracking-widest">Export</span>
                                        <ChevronDown size={14} className="opacity-50" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 bg-white border border-slate-200 shadow-2xl rounded-none">
                                    <DropdownMenuItem onClick={exportToExcel} className="h-12 px-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 cursor-pointer">
                                        <FileSpreadsheet size={16} className="text-emerald-500" /> Excel Sheet
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToPdf} className="h-12 px-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 cursor-pointer">
                                        <FileText size={16} className="text-rose-500" /> PDF Document
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToPdfLabel} className="h-12 px-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 cursor-pointer">
                                        <FileText size={16} className="text-indigo-500" /> PDF Labels
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                onClick={() => window.location.reload()}
                                className="h-14 w-14 border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center shadow-sm"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="flex-grow relative border-[3px] border-slate-200 shadow-2xl bg-white group overflow-hidden">
                        <style>{`
                            .center-header .ag-header-cell-label {
                                justify-content: center !important;
                                text-align: center !important;
                                width: 100%;
                            }
                            .ag-theme-alpine {
                                --ag-border-color: #cbd5e1;
                                --ag-row-border-color: #cbd5e1;
                                --ag-header-column-separator-display: block;
                                --ag-header-column-separator-color: #cbd5e1;
                                --ag-header-column-separator-height: 100%;
                            }
                            .ag-header-cell, .ag-cell {
                                border-right: 1px solid #cbd5e1 !important;
                                border-bottom: 1px solid #cbd5e1 !important;
                            }
                            .ag-row {
                                border-bottom: none !important; /* Managed by cells */
                            }
                        `}</style>
                        <div className="ag-theme-alpine w-full h-full">
                            <AgGridReact
                                ref={gridRef}
                                rowData={deliveryList}
                                columnDefs={columnDefs}
                                defaultColDef={defaultColDef}
                                quickFilterText={searchText}
                                rowHeight={70}
                                headerHeight={60}
                                animateRows={true}
                                pagination={true}
                                paginationPageSize={20}
                                loading={loading}
                                overlayLoadingTemplate='<div className="loader">Syncing Delivery Data...</div>'
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default Subscription;
