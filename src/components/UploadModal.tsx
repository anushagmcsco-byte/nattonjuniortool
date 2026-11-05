import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { SchoolRecord, PriorityLevel } from '../types/school';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download, 
  Sparkles,
  FileCheck2,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
import { extractAreaFromSchool } from '../utils/areaExtractor';

interface SheetInfo {
  sheetName: string;
  allRawRows: any[][];
  headerRowIdx: number;
  headers: string[];
  parsedRows: any[][];
  detectedColumns: Record<string, string>;
}

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (count: number, filename: string, records: SchoolRecord[], csvText: string, sheetNames?: string[]) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedSheets, setParsedSheets] = useState<SheetInfo[]>([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [importMode, setImportMode] = useState<'ALL_SHEETS' | 'ACTIVE_SHEET'>('ALL_SHEETS');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [rawCsvText, setRawCsvText] = useState<string>('');

  // Detect which row contains the actual table headers
  const findBestHeaderRow = (rows: any[][]): number => {
    let bestRow = 0;
    let highestScore = -1;

    const headerKeywords = [
      'name', 'school', 'schools', 'institution', 'college', 'academy', 'vidyalaya',
      'sl', 'sno', 'no', 'code', 'udise', 'area', 'locality', 'route', 'corridor',
      'hubli', 'dharwad', 'address', 'phone', 'contact', 'board', 'lab', 'computer'
    ];

    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r] || [];
      const nonBlank = row.filter((c: any) => c !== undefined && String(c).trim() !== '');
      if (nonBlank.length < 2) continue;

      const firstCell = String(row[0] || '').trim();
      const isFirstCellPureNumber = /^\d+$/.test(firstCell);

      let score = nonBlank.length * 2;
      for (const cell of nonBlank) {
        const text = String(cell).toLowerCase();
        if (headerKeywords.some((kw) => text.includes(kw))) {
          score += 15;
        }
      }

      if (isFirstCellPureNumber) {
        score -= 10;
      }

      if (score > highestScore) {
        highestScore = score;
        bestRow = r;
      }
    }

    return bestRow;
  };

  // Auto-map columns from headers & sample values
  const autoMapColumns = (rawHeaders: string[], dataRows: any[][]): Record<string, string> => {
    const mapping: Record<string, string> = {};

    rawHeaders.forEach((header) => {
      const h = header.toLowerCase().trim();

      // School Name
      if (
        !mapping['name'] &&
        (
          /\b(schools?|institutions?|campuss?|colleges?|academ(?:y|ies)|vidyalayas?|shalas?|institutes?|centers?|centres?|particulars|names?)\b/i.test(h) ||
          /school|institution|college|academy|vidyalaya|particulars/i.test(h) ||
          /ಶಾಲೆಯ|ಶಾಲೆ|ವಿದ್ಯಾಲಯ|ಹೆಸರು|ಸ್ಕೂಲ್|ಸಂಸ್ಥೆ|ವಿವರ|ವಿದ್ಯಾನಿಕೇತನ|shale/i.test(h) ||
          /स्कूल|विद्यालय|नाम/i.test(h)
        ) &&
        !/contact.*name|principal|headmaster|headmistress|incharge|officer|owner|father|student/i.test(h)
      ) {
        mapping['name'] = header;
      }

      // UDISE / Code
      if (
        !mapping['code'] &&
        (/udise|school.*code|school.*id|\bcode\b|reg.*no|sl.*no|s\.no|\bsl\b|\bno\b|\b#\b|roll/i.test(h))
      ) {
        mapping['code'] = header;
      }

      // Area / Locality / Route
      if (
        !mapping['area'] &&
        (/area|locality|location|route|hubli|dharwad|place|taluk|district|cluster|block|address|corridor|zone/i.test(h))
      ) {
        mapping['area'] = header;
      }

      // Board
      if (
        !mapping['board'] &&
        (/board|curriculum|affiliation|category|type|medium/i.test(h))
      ) {
        mapping['board'] = header;
      }

      // City
      if (
        !mapping['city'] &&
        (/city|town|district|taluk/i.test(h))
      ) {
        mapping['city'] = header;
      }

      // Computer Lab
      if (
        !mapping['computerLab'] &&
        (/(?:computer|ict|it)[\s_-]*lab|computer[\s_-]*facility|\blab\b/i.test(h)) &&
        !/source|url|date|note/i.test(h)
      ) {
        mapping['computerLab'] = header;
      }

      // Website
      if (
        !mapping['website'] &&
        (/website|web|url|domain|portal|link/i.test(h))
      ) {
        mapping['website'] = header;
      }

      // Phone
      if (
        !mapping['phone'] &&
        (/phone|mobile|contact.*no|cell|tel|telephone/i.test(h))
      ) {
        mapping['phone'] = header;
      }

      // Contact Person
      if (
        !mapping['contact'] &&
        (/contact.*person|principal|headmaster|headmistress|incharge|hm\b/i.test(h))
      ) {
        mapping['contact'] = header;
      }
    });

    // If School Name is still not detected, scan sample row values across columns
    if (!mapping['name'] && rawHeaders.length > 0) {
      let bestNameCol = -1;
      let highestNameScore = -1;

      if (dataRows && dataRows.length > 0) {
        for (let col = 0; col < rawHeaders.length; col++) {
          let schoolWordMatches = 0;
          let totalLength = 0;
          let count = 0;

          for (let row = 0; row < Math.min(dataRows.length, 15); row++) {
            const val = String(dataRows[row]?.[col] || '').trim();
            if (!val) continue;
            count++;
            totalLength += val.length;
            if (
              /\b(school|vidyalaya|academy|high|primary|convent|kps|ghps|glps|college|institute|hubli|dharwad|public|english|kannada|medium|samiti|trust|shikshana)\b/i.test(val)
            ) {
              schoolWordMatches += 6;
            }
          }

          const avgLen = count > 0 ? totalLength / count : 0;
          const lengthScore = avgLen >= 12 && avgLen <= 90 ? 4 : avgLen > 3 ? 1 : 0;
          const score = schoolWordMatches + lengthScore;

          if (score > highestNameScore) {
            highestNameScore = score;
            bestNameCol = col;
          }
        }
      }

      if (bestNameCol !== -1 && highestNameScore > 0) {
        mapping['name'] = rawHeaders[bestNameCol];
      } else {
        const defaultIdx = rawHeaders.length > 1 ? 1 : 0;
        mapping['name'] = rawHeaders[defaultIdx];
      }
    } else if (!mapping['name'] && rawHeaders.length > 0) {
      mapping['name'] = rawHeaders[rawHeaders.length > 1 ? 1 : 0];
    }

    return mapping;
  };

  const processSheetRows = (rows: any[][], customHeaderIdx?: number): {
    headerRowIdx: number;
    headers: string[];
    dataRows: any[][];
    detectedColumns: Record<string, string>;
  } => {
    const bestRow = customHeaderIdx !== undefined ? customHeaderIdx : findBestHeaderRow(rows);
    const rawHeaderRow = rows[bestRow] || [];
    const sanitizedHeaders: string[] = [];
    const seen = new Set<string>();

    for (let c = 0; c < rawHeaderRow.length; c++) {
      let h = String(rawHeaderRow[c] || '').trim();
      if (!h) h = `Column ${c + 1}`;
      let uniqueH = h;
      let counter = 2;
      while (seen.has(uniqueH.toLowerCase())) {
        uniqueH = `${h} (${counter++})`;
      }
      seen.add(uniqueH.toLowerCase());
      sanitizedHeaders.push(uniqueH);
    }

    const dataRows = rows.slice(bestRow + 1).filter((r) =>
      r && r.some((c: any) => c !== undefined && String(c).trim() !== '')
    );

    const mapping = autoMapColumns(sanitizedHeaders, dataRows);

    return {
      headerRowIdx: bestRow,
      headers: sanitizedHeaders,
      dataRows,
      detectedColumns: mapping,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setError('The uploaded Excel workbook contains no sheet tabs.');
          setIsProcessing(false);
          return;
        }

        const sheetsCollected: SheetInfo[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;

          const jsonRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          if (!jsonRows || jsonRows.length === 0) return;

          const nonBlankRows = jsonRows.filter((r) =>
            r && r.some((c: any) => c !== undefined && String(c).trim() !== '')
          );

          if (nonBlankRows.length >= 2) {
            const processed = processSheetRows(nonBlankRows);
            sheetsCollected.push({
              sheetName,
              allRawRows: nonBlankRows,
              headerRowIdx: processed.headerRowIdx,
              headers: processed.headers,
              parsedRows: processed.dataRows,
              detectedColumns: processed.detectedColumns,
            });
          }
        });

        if (sheetsCollected.length === 0) {
          setError('None of the sheets in the uploaded file contain valid data rows or column headers.');
          setIsProcessing(false);
          return;
        }

        setParsedSheets(sheetsCollected);
        setActiveSheetIdx(0);
        // Default to importing all sheet tabs when multi-sheet is detected
        setImportMode(sheetsCollected.length > 1 ? 'ALL_SHEETS' : 'ACTIVE_SHEET');

        // Generate combined CSV text preview
        const firstSheet = workbook.Sheets[sheetsCollected[0].sheetName];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        setRawCsvText(csv);
        setIsProcessing(false);
      } catch (err: any) {
        setError(`Failed to parse file: ${err?.message || 'Unsupported format'}`);
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Could not read the uploaded file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleHeaderRowChange = (sheetIdx: number, newIdx: number) => {
    setParsedSheets((prev) => {
      const next = [...prev];
      const target = next[sheetIdx];
      if (!target) return prev;
      const reprocessed = processSheetRows(target.allRawRows, newIdx);
      next[sheetIdx] = {
        ...target,
        headerRowIdx: newIdx,
        headers: reprocessed.headers,
        parsedRows: reprocessed.dataRows,
        detectedColumns: reprocessed.detectedColumns,
      };
      return next;
    });
  };

  const handleColumnMappingChange = (sheetIdx: number, fieldKey: string, selectedHeader: string) => {
    setParsedSheets((prev) => {
      const next = [...prev];
      const target = next[sheetIdx];
      if (!target) return prev;
      next[sheetIdx] = {
        ...target,
        detectedColumns: {
          ...target.detectedColumns,
          [fieldKey]: selectedHeader,
        },
      };
      return next;
    });
  };

  const currentSheet = parsedSheets[activeSheetIdx] || parsedSheets[0];
  const totalRowsAllSheets = parsedSheets.reduce((sum, s) => sum + s.parsedRows.length, 0);

  const handleConfirmImport = () => {
    if (!parsedSheets.length) {
      setError('No sheets found to import.');
      return;
    }

    const sheetsToImport = importMode === 'ALL_SHEETS' ? parsedSheets : [currentSheet];
    const generatedSchools: SchoolRecord[] = [];
    const sheetNamesList: string[] = [];

    sheetsToImport.forEach((sheet) => {
      sheetNamesList.push(sheet.sheetName);
      let schoolNameHeader = sheet.detectedColumns['name'];
      if (!schoolNameHeader || sheet.headers.indexOf(schoolNameHeader) === -1) {
        schoolNameHeader = sheet.headers[1] || sheet.headers[0];
      }

      const nameColIdx = sheet.headers.indexOf(schoolNameHeader);

      sheet.parsedRows.forEach((row, rowIdx) => {
        const getVal = (fieldKey: string) => {
          const colHeader = sheet.detectedColumns[fieldKey];
          if (!colHeader) return '';
          const colIdx = sheet.headers.indexOf(colHeader);
          return colIdx !== -1 && row[colIdx] !== undefined ? String(row[colIdx]).trim() : '';
        };

        const extractedName = nameColIdx !== -1 && row[nameColIdx] !== undefined ? String(row[nameColIdx]).trim() : '';
        const rawName = extractedName || `School ${generatedSchools.length + 1}`;
        const code = getVal('code') || `SCH-${Date.now()}-${generatedSchools.length + 1}`;
        const rawArea = getVal('area');
        const rawAddress = getVal('address') || getVal('locality') || getVal('location') || '';
        const city = getVal('city') || (fileName.toLowerCase().includes('hubli') ? 'Hubli' : 'Hubli-Dharwad');
        const area = extractAreaFromSchool(rawName, rawArea, city, rawAddress) || sheet.sheetName || 'Hubli';
        const board = getVal('board') || 'State Board / CBSE';
        const website = getVal('website');
        const rawLab = getVal('computerLab');

        const uploadedData: Record<string, string> = {
          'Sheet Tab': sheet.sheetName,
        };

        sheet.headers.forEach((h, cIdx) => {
          if (row[cIdx] !== undefined) {
            uploadedData[h] = String(row[cIdx]).trim();
          }
        });

        const overallIdx = generatedSchools.length;
        const priorityLevel: PriorityLevel = overallIdx < 12 ? 'P1_CRITICAL' : overallIdx < 28 ? 'P2_HIGH' : 'P3_MEDIUM';
        const priorityScore = Math.max(40, 100 - overallIdx * 2);

        let parsedLab: 'Yes' | 'No' | undefined = undefined;
        if (rawLab) {
          if (/yes|available|present|true|1/i.test(rawLab)) parsedLab = 'Yes';
          else if (/no|absent|none|nil|false|0/i.test(rawLab)) parsedLab = 'No';
        }

        generatedSchools.push({
          id: `sch-imp-${Date.now()}-${overallIdx + 1}`,
          code,
          name: rawName,
          board,
          category: 'Secondary / High School',
          industry: 'Education',
          area,
          city,
          state: 'Karnataka',
          pincode: getVal('pincode') || '580020',
          website: website || undefined,
          mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${rawName} ${area} ${city}`)}`,
          contactPerson: getVal('contact') || 'Principal Office',
          contactPhone: getVal('phone') || '+91 836 000 0000',
          totalVisitsCount: 0,
          daysSinceLastVisit: 65,
          studentEnrollment: 1250,
          priorityLevel,
          priorityScore,
          targetPriorityReason: `Uploaded from ${fileName} (Tab: ${sheet.sheetName}). Queued for automated computer lab verification and route planning.`,
          computerLab: parsedLab,
          computerLabCheckStatus: 'QUEUED',
          uploadedReviewCount: 'Pending',
          uploadedData,
          source: 'USER_UPLOAD',
          sheetName: sheet.sheetName,
        });
      });
    });

    if (generatedSchools.length === 0) {
      setError('No schools could be extracted from the selected sheets.');
      return;
    }

    onSuccess(generatedSchools.length, fileName, generatedSchools, rawCsvText, sheetNamesList);
  };

  const handleDownloadSample = () => {
    // Generate a sample workbook with 2 separate sheet tabs to test multi-sheet extraction
    const wb = XLSX.utils.book_new();

    const hubliNorthData = [
      {
        'Sl No': '1',
        'School Name': 'K.L.E. Society English Medium School',
        'UDISE Code': '29090101101',
        'Area': 'Vidyanagar',
        'City': 'Hubli',
        'Board': 'CBSE',
        'Computer Lab': 'Yes',
        'Website': 'https://kleschoolhubli.edu.in',
        'Contact Person': 'S. R. Patil',
        'Phone': '+91 836 237 2200',
      },
      {
        'Sl No': '2',
        'School Name': 'St. Pauls High School',
        'UDISE Code': '29090101102',
        'Area': 'Keshwapur',
        'City': 'Hubli',
        'Board': 'State Board',
        'Computer Lab': 'Yes',
        'Website': '',
        'Contact Person': 'Fr. Joseph',
        'Phone': '+91 836 226 3450',
      },
      {
        'Sl No': '3',
        'School Name': 'Government Model High School (GMHS Hubli)',
        'UDISE Code': '29090101103',
        'Area': 'Old Hubli',
        'City': 'Hubli',
        'Board': 'State Board',
        'Computer Lab': 'No',
        'Website': '',
        'Contact Person': 'Headmaster',
        'Phone': '+91 836 228 1122',
      },
    ];

    const hubliSouthData = [
      {
        'Sl No': '1',
        'School Name': 'Rotary School of Excellence',
        'UDISE Code': '29090101201',
        'Area': 'Gokul Road',
        'City': 'Hubli',
        'Board': 'ICSE',
        'Computer Lab': 'Yes',
        'Website': 'https://rotaryschoolhubli.edu.in',
        'Contact Person': 'Anita Kulkarni',
        'Phone': '+91 836 233 4455',
      },
      {
        'Sl No': '2',
        'School Name': 'Shri Basaveshwara Rural High School',
        'UDISE Code': '29090101202',
        'Area': 'Navanagar',
        'City': 'Hubli',
        'Board': 'State Board',
        'Computer Lab': 'Unverified',
        'Website': '',
        'Contact Person': 'M. V. Hiremath',
        'Phone': '+91 836 222 7890',
      },
    ];

    const ws1 = XLSX.utils.json_to_sheet(hubliNorthData);
    const ws2 = XLSX.utils.json_to_sheet(hubliSouthData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Hubli_North_Zone');
    XLSX.utils.book_append_sheet(wb, ws2, 'Hubli_South_Zone');
    XLSX.writeFile(wb, 'Sample_Hubli_MultiSheet_Schools.xlsx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Import School Register (.xlsx / .csv)</h2>
              <p className="text-xs text-slate-400">
                Upload your school list to automatically discover computer labs, fetch from separate sheet tabs & build persistent roadmaps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Dropzone / File Status Card */}
          {!fileName ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-3xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/40 transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">
                Click or drag Excel / CSV file here to import
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports .xlsx, .xls, and .csv formats • Automatically parses all sheet tabs
              </p>
            </div>
          ) : (
            <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-xs sm:text-sm break-all">
                    {fileName}
                  </div>
                  <div className="text-[11px] text-blue-700 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>
                      {importMode === 'ALL_SHEETS' 
                        ? `${totalRowsAllSheets} Schools across ${parsedSheets.length} Sheet Tabs` 
                        : `${currentSheet?.parsedRows?.length || 0} Schools in ${currentSheet?.sheetName || 'Selected Sheet'}`}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setFileName('');
                  setParsedSheets([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="self-end sm:self-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Change File</span>
              </button>
            </div>
          )}

          {/* Multi-Sheet Tabs Bar & Mode Selector */}
          {parsedSheets.length > 1 && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    Multiple Sheet Tabs Detected ({parsedSheets.length} Sheets)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="sheetImportMode"
                      checked={importMode === 'ALL_SHEETS'}
                      onChange={() => setImportMode('ALL_SHEETS')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-indigo-950">Fetch & Merge All Sheets ({totalRowsAllSheets})</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-medium text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="sheetImportMode"
                      checked={importMode === 'ACTIVE_SHEET'}
                      onChange={() => setImportMode('ACTIVE_SHEET')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Active Sheet Only</span>
                  </label>
                </div>
              </div>

              {/* Sheet Tab Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">Preview Tab:</span>
                {parsedSheets.map((sheet, sIdx) => (
                  <button
                    key={sheet.sheetName}
                    type="button"
                    onClick={() => setActiveSheetIdx(sIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                      activeSheetIdx === sIdx
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sheet.sheetName}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeSheetIdx === sIdx ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {sheet.parsedRows.length}
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {importMode === 'ALL_SHEETS' 
                  ? `✓ All ${parsedSheets.length} sheet tabs will be imported together into the unified database. The sheet tab name will be preserved for each school.`
                  : `Only the active sheet "${currentSheet?.sheetName}" will be imported.`}
              </p>
            </div>
          )}

          {/* Column Mapping Card for Active Sheet */}
          {currentSheet && currentSheet.parsedRows.length > 0 && currentSheet.headers.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    Column Mapping for Tab: <span className="text-blue-700 underline">{currentSheet.sheetName}</span>
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Auto-Configured
                </span>
              </div>

              {/* Header Row Selector */}
              {currentSheet.allRawRows.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Header Row in File:</span>
                    <span className="text-[10px] text-slate-500">
                      Row {currentSheet.headerRowIdx + 1} contains column headers
                    </span>
                  </div>
                  <select
                    value={currentSheet.headerRowIdx}
                    onChange={(e) => handleHeaderRowChange(activeSheetIdx, parseInt(e.target.value, 10))}
                    className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 text-xs cursor-pointer max-w-full sm:max-w-[260px] truncate"
                  >
                    {currentSheet.allRawRows.slice(0, 10).map((r, rIdx) => {
                      const label = r
                        .filter((c: any) => c !== undefined && String(c).trim() !== '')
                        .slice(0, 3)
                        .map((c: any) => String(c).trim())
                        .join(' | ');
                      return (
                        <option key={rIdx} value={rIdx}>
                          Row {rIdx + 1}: {label || '(Empty row)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Mappings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* School Name Column */}
                <div className="p-3 bg-white border-2 border-blue-500 rounded-xl space-y-1 shadow-2xs">
                  <label className="font-bold text-blue-950 text-xs flex items-center justify-between">
                    <span>School Name Column *</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3 text-emerald-600" /> Auto-Selected
                    </span>
                  </label>
                  <select
                    value={currentSheet.detectedColumns['name'] || currentSheet.headers[1] || currentSheet.headers[0] || ''}
                    onChange={(e) => handleColumnMappingChange(activeSheetIdx, 'name', e.target.value)}
                    className="w-full p-2 bg-blue-50/50 border border-blue-400 rounded-lg font-bold text-slate-900 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {currentSheet.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Sample: {currentSheet.parsedRows[0]?.[currentSheet.headers.indexOf(currentSheet.detectedColumns['name'] || currentSheet.headers[1] || currentSheet.headers[0])] || 'DPS, KLE Society...'}
                  </span>
                </div>

                {/* Area / Route Column */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <label className="font-bold text-slate-700 text-xs block">
                    Area / Route / Locality Column
                  </label>
                  <select
                    value={currentSheet.detectedColumns['area'] || ''}
                    onChange={(e) => handleColumnMappingChange(activeSheetIdx, 'area', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="">-- Optional (Uses Sheet Name / Auto) --</option>
                    {currentSheet.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Corridor or Zone
                  </span>
                </div>

                {/* UDISE / Code Column */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <label className="font-bold text-slate-700 text-xs block">
                    UDISE / Code Column
                  </label>
                  <select
                    value={currentSheet.detectedColumns['code'] || ''}
                    onChange={(e) => handleColumnMappingChange(activeSheetIdx, 'code', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="">-- Optional (Auto-generate) --</option>
                    {currentSheet.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Computer Lab Column */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <label className="font-bold text-slate-700 text-xs block">
                    Computer Lab Status Column
                  </label>
                  <select
                    value={currentSheet.detectedColumns['computerLab'] || ''}
                    onChange={(e) => handleColumnMappingChange(activeSheetIdx, 'computerLab', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs cursor-pointer"
                  >
                    <option value="">-- Auto-verify via Web if blank --</option>
                    {currentSheet.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 text-[11px] block">
                    Tab Preview ({currentSheet.sheetName}):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Showing first 3 of {currentSheet.parsedRows.length} schools
                  </span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">School Name</th>
                        <th className="p-2">Area / Locality</th>
                        <th className="p-2">Lab Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentSheet.parsedRows.slice(0, 3).map((r, i) => {
                        const nameHeader = currentSheet.detectedColumns['name'] || currentSheet.headers[1] || currentSheet.headers[0];
                        const areaHeader = currentSheet.detectedColumns['area'];
                        const labHeader = currentSheet.detectedColumns['computerLab'];
                        const nameIdx = currentSheet.headers.indexOf(nameHeader);
                        const areaIdx = areaHeader ? currentSheet.headers.indexOf(areaHeader) : -1;
                        const labIdx = labHeader ? currentSheet.headers.indexOf(labHeader) : -1;

                        const schoolNameStr = nameIdx !== -1 && r[nameIdx] ? String(r[nameIdx]) : `School ${i + 1}`;
                        const rawAreaStr = areaIdx !== -1 && r[areaIdx] ? String(r[areaIdx]) : '';
                        const resolvedArea = extractAreaFromSchool(schoolNameStr, rawAreaStr, 'Hubli') || currentSheet.sheetName;

                        return (
                          <tr key={i}>
                            <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                            <td className="p-2 font-bold text-slate-900">
                              {schoolNameStr}
                            </td>
                            <td className="p-2 font-bold text-blue-900 bg-blue-50/50">
                              {resolvedArea}
                            </td>
                            <td className="p-2 text-slate-500">
                              {labIdx !== -1 && r[labIdx] ? String(r[labIdx]) : 'Auto-verify'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Download Sample */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100 rounded-2xl text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-700 font-bold block">Need a test multi-sheet Hubli spreadsheet?</span>
              <span className="text-slate-500 text-[11px] block">Includes North and South Hubli zone tabs for instant multi-sheet testing.</span>
            </div>
            <button
              onClick={handleDownloadSample}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 font-bold rounded-xl text-blue-700 flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Multi-Sheet Template</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedSheets.length || isProcessing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>
              Confirm & Save {importMode === 'ALL_SHEETS' 
                ? `(${totalRowsAllSheets} Schools across ${parsedSheets.length} Tabs)` 
                : `(${currentSheet?.parsedRows?.length || 0} Schools in ${currentSheet?.sheetName || ''})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
