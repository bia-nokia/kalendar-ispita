import React, { useState, useEffect, createContext, useContext, memo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  differenceInCalendarDays,
  parseISO,
  getDay,
  addMonths
} from 'date-fns';
import { hr } from 'date-fns/locale';
import * as ics from 'ics'; // 👈 For calendar export

// --- TYPE DEFINITIONS ---
type Exam = { id: number; name: string; colorIdx: number; part: string | null; dates:string[]; };
type ExamWithColor = Exam & { color:string; };

// --- ICONS ---
const StarIcon: React.FC<{ className?: string }> = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.24 5.383c.294 1.226-.954 2.187-2.056 1.578l-4.832-2.848-4.832 2.848c-1.103.61-2.351-.352-2.056-1.578l1.24-5.383-4.116-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" /></svg>);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>);
const ReaddIcon: React.FC<{ className?: string }> = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);

// --- CONSTANTS AND STATIC DATA ---
const basePalette: string[] = ["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", "#9a6324"];

// --- UPDATED EXAMS DATA ---
const exams: Exam[] = [
  { id: 1, name: "ZGRADE ZA SPORT", colorIdx: 0, part: null, dates: ["2025-07-01", "2025-07-14", "2025-08-27", "2025-09-09"] },
  { id: 2, name: "HRVATSKA TRADICIJSKA ARHITEKTURA", colorIdx: 1, part: null, dates: ["2025-07-01", "2025-07-14", "2025-08-27", "2025-09-09"] },
  { id: 3, name: "ARHITEKTONSKI URED – ORGANIZACIJA I POSLOVANJE", colorIdx: 2, part: null, dates: ["2025-06-24", "2025-07-08"] },
  { id: 4, name: "INŽENJERSKE KONSTRUKCIJE", colorIdx: 3, part: null, dates: ["2025-07-02", "2025-07-15", "2025-08-28", "2025-09-10"] },
  { id: 5, name: "ISTRAŽIVAČKI SEMINAR ARHITEKTURA I", colorIdx: 4, part: "I", dates: ["2025-06-23", "2025-07-14", "2025-09-01", "2025-09-12"] },
  { id: 6, name: "ISTRAŽIVAČKI SEMINAR ARHITEKTURA II", colorIdx: 4, part: "II", dates: ["2025-06-23", "2025-07-14", "2025-09-01", "2025-09-12"] },
  { id: 7, name: "NASLIJEĐE EUROPSKOG URBANIZMA", colorIdx: 6, part: null, dates: ["2025-06-24", "2025-07-07", "2025-07-18", "2025-09-02", "2025-09-15"] },
  { id: 8, name: "POSTUPCI SANACIJA I POJAČANJA POSTOJEĆIH KONSTRUKCIJA", colorIdx: 7, part: null, dates: ["2025-07-02", "2025-07-15", "2025-08-28", "2025-09-10"] },
  { id: 9, name: "PROSTORNO PLANIRANJE", colorIdx: 8, part: null, dates: ["2025-07-01", "2025-07-14", "2025-08-27", "2025-09-09"] },
  { id: 10, name: "SUVREMENO STANOVANJE", colorIdx: 9, part: null, dates: ["2025-07-02", "2025-07-15", "2025-08-28", "2025-09-10"] },
  { id: 11, name: "TEORIJA ARHITEKTURE I", colorIdx: 10, part: "I", dates: ["2025-06-23", "2025-07-04", "2025-07-17", "2025-09-01", "2025-09-12"] },
  { id: 12, name: "TEORIJA ARHITEKTURE II", colorIdx: 10, part: "II", dates: ["2025-06-23", "2025-07-04", "2025-07-17", "2025-09-01", "2025-09-12"] },
  { id: 13, name: "VISOKOTEHNOLOŠKA ARHITEKTURA", colorIdx: 11, part: null, dates: ["2025-07-03", "2025-07-16", "2025-08-29", "2025-09-11"] },
];

// --- UTILITY FUNCTION ---
const shadeColor = (color: string, percent: number): string => {
    let R = parseInt(color.substring(1, 3), 16), G = parseInt(color.substring(3, 5), 16), B = parseInt(color.substring(5, 7), 16);
    R = Math.round(R * (100 + percent) / 100); G = Math.round(G * (100 + percent) / 100); B = Math.round(B * (100 + percent) / 100);
    R = (R < 255) ? R : 255; G = (G < 255) ? G : 255; B = (B < 255) ? B : 255;  
    return "#" + ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16)) + ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16)) + ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));
}

// --- DERIVED DATA ---
const examsWithColors: ExamWithColor[] = exams.map(exam => ({...exam, color: exam.part === "II" ? shadeColor(basePalette[exam.colorIdx], 35) : basePalette[exam.colorIdx]}));
const dateMap: Record<string, ExamWithColor[]> = {};
examsWithColors.forEach(exam => { exam.dates.forEach(dateStr => { if (!dateMap[dateStr]) dateMap[dateStr] = []; dateMap[dateStr].push(exam); }); });

// --- CUSTOM HOOKS ---
const useCalendarState = () => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [deactivatedIds, setDeactivatedIds] = useState<Set<number>>(new Set());
    const [goalDateIds, setGoalDateIds] = useState<Set<string>>(new Set()); // Key: "examId-dateString"

    const toggleDeactivatedId = (id: number) => { 
        setDeactivatedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
        setSelectedIds(s => { const ns = new Set(s); ns.delete(id); return ns; });
        setGoalDateIds(g => { const ng = new Set(g); for (const key of ng) { if (key.startsWith(`${id}-`)) ng.delete(key); } return ng; });
    };

    const toggleSelectedId = (id: number) => { setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
    
    const toggleGoalDateId = (examId: number, date: string) => { 
        const key = `${examId}-${date}`;
        setGoalDateIds(prev => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; }); 
    };
    
    const resetAllFilters = () => { setSelectedIds(new Set()); setDeactivatedIds(new Set()); setGoalDateIds(new Set()); };
    
    return { selectedIds, toggleSelectedId, setSelectedIds, deactivatedIds, toggleDeactivatedId, goalDateIds, toggleGoalDateId, resetAllFilters };
};

const useExamState = (examId: number) => {
  const { selectedIds } = useCalendar();
  return { isSelected: selectedIds.has(examId), isDimmed: selectedIds.size > 0 && !selectedIds.has(examId) };
};

// --- CONTEXT ---
type CalendarContextType = ReturnType<typeof useCalendarState> & { today: Date };
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);
const useCalendar = (): CalendarContextType => {
    const context = useContext(CalendarContext);
    if (!context) throw new Error("useCalendar must be used within a CalendarProvider");
    return context;
};

// --- HELPER COMPONENT ---
const CountdownIndicator: React.FC<{ date: Date, small?: boolean }> = ({ date, small }) => {
    const { today } = useCalendar();
    const daysDiff = differenceInCalendarDays(date, today);
    if (daysDiff < 0) return <span className={`font-bold text-green-600 ${small ? 'text-xs' : 'text-sm'}`}>✓</span>;
    return <span className={`font-semibold text-gray-500 ${small ? 'text-xs' : 'text-sm'}`}>({daysDiff}d)</span>;
};

// --- UI COMPONENTS ---
const DayCell = memo(({ day, monthStart, isTopRow, isFirstColumn }: { day: Date, monthStart: Date, isTopRow: boolean, isFirstColumn: boolean }) => {
    const { today, selectedIds, setSelectedIds, deactivatedIds, goalDateIds } = useCalendar();
    
    const baseBorderClass = `border-b border-r border-gray-200 ${isFirstColumn ? 'border-l' : ''} ${isTopRow ? 'border-t' : ''}`;

    if (!isSameMonth(day, monthStart)) {
        return <div className={baseBorderClass}></div>;
    }

    const dateKey = format(day, 'yyyy-MM-dd');
    const examsForDay = dateMap[dateKey] || [];
    const dayOfWeek = getDay(day);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHighlightedBySelection = selectedIds.size > 0 && examsForDay.some(exam => selectedIds.has(exam.id));

    const handleDayClick = () => {
        const examIdsOnDay = examsForDay.filter(exam => !deactivatedIds.has(exam.id)).map(exam => exam.id);
        setSelectedIds(new Set(examIdsOnDay));
    };

    return (
        <div onClick={handleDayClick} className={`relative h-28 p-1 transition-all duration-300 group cursor-pointer hover:bg-blue-50 ${isWeekend ? 'bg-gray-50' : 'bg-white'} ${isHighlightedBySelection ? 'bg-yellow-100 ring-2 ring-yellow-400 z-10' : ''} ${baseBorderClass}`}>
            <div className="flex justify-between items-start">
                <time dateTime={dateKey} className={`text-lg ${isSameDay(day, today) ? 'bg-red-600 text-white rounded-full flex items-center justify-center h-7 w-7 font-bold' : ''}`}>{format(day, 'd')}</time>
                {examsForDay.length > 0 && <CountdownIndicator date={day} small />}
            </div>
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-wrap gap-1">
                {examsForDay.map(exam => {
                    if (deactivatedIds.has(exam.id)) return null;
                    const { isDimmed } = useExamState(exam.id);
                    const isGoal = goalDateIds.has(`${exam.id}-${dateKey}`);
                    return (
                        <span key={exam.id} style={{ backgroundColor: exam.color }} className={`relative h-5 w-5 rounded-full block border-2 border-white shadow-md transition-all duration-300 ${isDimmed ? 'opacity-10' : 'opacity-100'}`} title={exam.name}>
                            <span className="sr-only">Ispit: {exam.name}</span>
                            {isGoal && <StarIcon className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-yellow-400 drop-shadow-lg" />}
                        </span>
                    );
                })}
            </div>
        </div>
    );
});

const CalendarMonthGrid: React.FC<{ monthDate: Date }> = ({ monthDate }) => {
    const monthStart = startOfMonth(monthDate);
    const firstDayOfWeek = startOfWeek(monthStart, { weekStartsOn: 1 });
    const lastDayOfGrid = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfGrid });
    const dayNames = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

    const monthName = format(monthStart, "LLLL", { locale: hr });
    const year = format(monthStart, "yyyy");
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return (
        <div className="w-full mb-8">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">{capitalizedMonthName} {year}</h2>
            <div className="grid grid-cols-7 text-center font-semibold text-gray-600 text-sm">
                {dayNames.map((day, i) => <div key={day} className={`py-1 ${i > 4 ? 'text-gray-400' : ''}`}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
                {days.map((day, i) => (<DayCell key={day.toISOString()} day={day} monthStart={monthStart} isTopRow={i < 7} isFirstColumn={i % 7 === 0}/>))}
            </div>
        </div>
    );
};

const ExamListItem = memo(({ exam, isIgnored }: { exam: ExamWithColor; isIgnored: boolean; }) => {
    const { toggleSelectedId, toggleDeactivatedId, toggleGoalDateId, goalDateIds } = useCalendar();
    const { isSelected, isDimmed } = useExamState(exam.id);
    
    return (
         <div className={`p-1.5 rounded-md transition-all duration-300 ${isIgnored ? 'bg-gray-200' : isDimmed ? 'opacity-40' : 'bg-white'}`}>
            <div className="flex items-center w-full text-left">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <button onClick={() => toggleDeactivatedId(exam.id)} title={isIgnored ? "Aktiviraj" : "Deaktiviraj"} className="p-1"><span className="sr-only">{isIgnored ? "Aktiviraj" : "Deaktiviraj"}</span>{isIgnored ? <ReaddIcon className="h-5 w-5 text-gray-500 hover:text-green-600"/> : <TrashIcon className="h-5 w-5 text-gray-400 hover:text-red-500"/>}</button>
                </div>
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    {!isIgnored && <input type="checkbox" checked={isSelected} onChange={() => toggleSelectedId(exam.id)} className="h-5 w-5 rounded text-pink-600 focus:ring-pink-500 border-gray-300 cursor-pointer"/>}
                </div>
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                    <span style={{ backgroundColor: isIgnored ? '#B0B0B0' : exam.color }} className="h-5 w-5 rounded-full flex-shrink-0 border-2 border-white shadow"><span className="sr-only">{exam.name}</span></span>
                </div>
                <span className={`text-sm font-medium flex-grow mr-2 ${isIgnored ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{exam.name}{exam.part && ` (${exam.part})`}</span>
            </div>
            {isSelected && !isIgnored && (
                <div className="pl-12 pr-2 mt-2 space-y-1">
                    {exam.dates.map(dateStr => {
                        const key = `${exam.id}-${dateStr}`;
                        const isGoal = goalDateIds.has(key);
                        return (
                            <div key={dateStr} className="flex justify-between items-center text-xs">
                                <span className="text-gray-700">{format(parseISO(dateStr), 'EEEE, dd.MM.yyyy', {locale: hr})}</span>
                                <div className="flex items-center gap-2">
                                  <CountdownIndicator date={parseISO(dateStr)} small/>
                                  <button onClick={() => toggleGoalDateId(exam.id, dateStr)} className={`p-0.5 rounded-full ${isGoal ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}><span className="sr-only">Označi kao cilj</span><StarIcon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
});

// 👇 MODIFIED LEGEND COMPONENT WITH EXPORT FUNCTIONALITY 👇
const Legend: React.FC = () => {
    const { selectedIds, deactivatedIds, resetAllFilters, goalDateIds } = useCalendar();
    const [searchTerm, setSearchTerm] = useState('');

    const handleExport = () => {
        if (selectedIds.size === 0) {
            alert("Niste odabrali niti jedan ispit za izvoz.");
            return;
        }

        const events: ics.EventAttributes[] = [];

        selectedIds.forEach(id => {
            const exam = examsWithColors.find(e => e.id === id);
            if (!exam) return;

            exam.dates.forEach(dateStr => {
                const date = parseISO(dateStr);
                const isGoal = goalDateIds.has(`${exam.id}-${dateStr}`);
                
                events.push({
                    start: [date.getFullYear(), date.getMonth() + 1, date.getDate()],
                    duration: { days: 1 },
                    title: `${isGoal ? '⭐ CILJ: ' : ''}${exam.name}${exam.part ? ` (${exam.part})` : ''}`,
                    description: `Rok za ispit: ${exam.name}`,
                    status: 'CONFIRMED',
                    busyStatus: 'FREE',
                });
            });
        });
        
        const { error, value } = ics.createEvents(events);

        if (error) {
            console.error(error);
            alert("Došlo je do greške prilikom generiranja kalendara.");
            return;
        }

        if (!value) {
            alert("Nije moguće generirati datoteku.");
            return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Moji_Ispiti.ics';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const filteredExams = examsWithColors.filter(exam => exam.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const activeExams = filteredExams.filter(exam => !deactivatedIds.has(exam.id));
    const ignoredExams = filteredExams.filter(exam => deactivatedIds.has(exam.id));
    
    return (
        <div className="lg:w-[450px] lg:flex-shrink-0">
            <div className="lg:fixed lg:w-[450px] p-4 bg-gray-100 rounded-lg shadow-md flex flex-col h-full lg:max-h-[calc(100vh-4rem)]">
                <div className="flex-shrink-0 border-b pb-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold text-gray-800">Legenda Ispita</h2>
                        <div className="flex items-center gap-4">
                           <button 
                                onClick={handleExport} 
                                className="text-sm text-green-600 hover:underline font-semibold disabled:text-gray-400 disabled:no-underline"
                                disabled={selectedIds.size === 0}
                                title={selectedIds.size === 0 ? "Prvo odaberite ispite" : "Izvezi odabrane ispite (.ics)"}
                            >
                                Izvezi
                            </button>
                            <button 
                                onClick={() => {resetAllFilters(); setSearchTerm('');}} 
                                className="text-sm text-blue-600 hover:underline font-semibold"
                            >
                                Resetiraj
                            </button>
                        </div>
                    </div>
                    <input type="text" placeholder="Pretraži ispite..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                                
                <div className="flex-grow overflow-y-auto space-y-1 pr-2">
                    <h3 className="font-semibold text-gray-700 px-1.5 my-2">Aktivni Predmeti</h3>
                    {activeExams.length > 0 ? activeExams.map(exam => <ExamListItem key={exam.id} exam={exam} isIgnored={false} />) : <p className="text-sm text-gray-500 px-2">Nema rezultata.</p>}
                    {ignoredExams.length > 0 && (<details className="mt-4" open><summary className="font-semibold text-gray-600 cursor-pointer px-1.5">Ignorirani Predmeti ({ignoredExams.length})</summary><div className="mt-2 space-y-1">{ignoredExams.map(exam => <ExamListItem key={exam.id} exam={exam} isIgnored={true} />)}</div></details>)}
                </div>
            </div>
        </div>
    );
};

// --- ROOT APP COMPONENT ---
const ExamCalendarApp: React.FC = () => {
    const calendarStateHook = useCalendarState();
    const [today, setToday] = useState(new Date());

    useEffect(() => { 
        const timer = setInterval(() => setToday(new Date()), 60000); 
        return () => clearInterval(timer); 
    }, []);

    const contextValue = { ...calendarStateHook, today };

    const monthsToRender = Array.from({ length: 12 }, (_, i) => addMonths(new Date(2025, 5, 1), i));

    return (
        <CalendarContext.Provider value={contextValue}>
            <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}`}</style>
            <div className="p-4 sm:p-6 md:p-8 bg-white min-h-screen font-sans">
                 <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 flex-shrink-0">Raspored Ispita</h1>
                 <div className="flex flex-col lg:flex-row gap-8">
                     <Legend />
                     <div className="flex-1 overflow-y-auto">
                        {monthsToRender.map((monthDate) => (
                           <CalendarMonthGrid key={monthDate.toString()} monthDate={monthDate} />
                        ))}
                     </div>
                 </div>
            </div>
        </CalendarContext.Provider>
    );
};

export default ExamCalendarApp;