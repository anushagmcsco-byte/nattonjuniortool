import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  Packer,
  BorderStyle,
  ShadingType,
} from 'docx';
import { SchoolRecord } from '../types/school';
import { extractAreaFromSchool } from '../utils/areaExtractor';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportRoadmapToWord(
  schools: SchoolRecord[],
  options: {
    title?: string;
    period?: string;
    officerName?: string;
    areaFilter?: string;
  } = {}
) {
  const title = options.title || 'School Labs Verification & Field Route Roadmap';
  const period = options.period || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const officer = options.officerName || 'Field Officer / Administrator';

  const total = schools.length;
  const countYes = schools.filter((s) => s.computerLab === 'Yes').length;
  const countNo = schools.filter((s) => s.computerLab === 'No').length;
  const countUnverified = schools.filter((s) => !s.computerLab || s.computerLab === 'Unverified').length;

  const headerBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  };

  // Build Table Rows
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 6, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 28, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'School Name & Board', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Corridor / Tab', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Computer Lab', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 16, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Systems & LAN', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          shading: { fill: '1E293B', type: ShadingType.CLEAR },
          borders: headerBorders,
          children: [
            new Paragraph({
              children: [new TextRun({ text: 'Evidence / Notes', bold: true, color: 'FFFFFF', size: 18 })],
            }),
          ],
        }),
      ],
    }),
  ];

  schools.forEach((school, idx) => {
    const isEven = idx % 2 === 0;
    const rowFill = isEven ? 'FFFFFF' : 'F8FAFC';
    const labColor = school.computerLab === 'Yes' ? '047857' : school.computerLab === 'No' ? 'BE123C' : 'B45309';

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${idx + 1}`, bold: true, color: '334155', size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: school.name, bold: true, color: '0F172A', size: 18 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${school.board || 'State Board'} • Enrollment: ${school.studentEnrollment || 'N/A'}`,
                    color: '64748B',
                    size: 15,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: extractAreaFromSchool(school.name, school.area, school.city), bold: true, color: '1E293B', size: 17 }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.sheetName ? `Tab: ${school.sheetName}` : school.city,
                    color: '475569',
                    size: 15,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 14, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.computerLab ? `● ${school.computerLab}` : '○ Unverified',
                    bold: true,
                    color: labColor,
                    size: 17,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.computerLabSource === 'VISIT' ? 'Field Verified' : 'Portal Search',
                    color: '64748B',
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.labComputersCount ? `${school.labComputersCount} Computers` : (school.computerLab === 'Yes' ? 'Available' : 'None'),
                    bold: true,
                    color: '0F172A',
                    size: 17,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.labInternetAvailable ? String(school.labInternetAvailable).slice(0, 24) : 'Broadband',
                    color: '64748B',
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: rowFill, type: ShadingType.CLEAR },
            borders: cellBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: school.labVerificationNote || 'Scheduled for automated inspection.',
                    color: '334155',
                    size: 15,
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header / Banner
          new Paragraph({
            text: 'NATTON SKILLX JUNIOR',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.LEFT,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
                color: '1E3A8A',
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Planning Period: ${period}   |   Generated: ${new Date().toLocaleDateString()}   |   Officer: ${officer}`,
                color: '64748B',
                size: 18,
              }),
            ],
            spacing: { after: 240 },
          }),

          // Executive Summary Box
          new Paragraph({
            children: [
              new TextRun({
                text: `EXECUTIVE SUMMARY: Total Campuses: ${total}   |   Verified Labs: ${countYes}   |   No Labs: ${countNo}   |   Pending: ${countUnverified}`,
                bold: true,
                color: '0F172A',
                size: 20,
              }),
            ],
            shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
            spacing: { before: 100, after: 300 },
          }),

          // Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          // Sign-off section
          new Paragraph({
            text: '',
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Field Operations Sign-Off & Verification Approval:',
                bold: true,
                color: '1E293B',
                size: 18,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Inspected By: ___________________________          Date: ____________________          Approved By: ___________________________',
                color: '64748B',
                size: 16,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanFilename = `Natton_SkillX_Roadmap_${period.replace(/\s+/g, '_')}.docx`;
  downloadBlob(blob, cleanFilename);
}

export async function exportWeeklyItineraryToWord(
  weeks: Array<{ weekNumber: number; dates: string; schools: SchoolRecord[] }>,
  schools: SchoolRecord[],
  options: {
    month: string;
    weeklyTarget: number;
    window: string;
    officerName?: string;
    dayWiseTarget?: number;
    monthlyTarget?: number;
  }
) {
  const officer = options.officerName || 'Field Officer';
  const total = schools.length;
  const dayTarget = options.dayWiseTarget || 3;
  const weekTarget = options.weeklyTarget || 18;
  const monthTarget = options.monthlyTarget || (weekTarget * 4);
  const daysNeeded = Math.ceil(total / dayTarget);

  const children: any[] = [
    new Paragraph({
      text: 'NATTON SKILLX JUNIOR • ACCURATE FIELD ROADMAP',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `School Field Itinerary & Visiting Quota — ${options.month}`,
          bold: true,
          size: 30,
          color: '1E3A8A',
        }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Field Officer: ${officer}   |   Visiting Hours: 9:00 AM – 3:00 PM (6 hrs)   |   Generated: ${new Date().toLocaleDateString()}`,
          color: '64748B',
          size: 18,
        }),
      ],
      spacing: { after: 200 },
    }),
    // Quota Highlights Box
    new Paragraph({
      children: [
        new TextRun({
          text: `ACCURATE 9:00 AM – 3:00 PM TARGETS: Day-Wise: ${dayTarget} Schools/Day  |  Weekly: ${weekTarget} Schools/Week (Mon–Sat)  |  Monthly: ${monthTarget} Schools/Month  |  Loaded: ${total} Schools (${daysNeeded} Days Required)`,
          bold: true,
          color: '065F46',
          size: 18,
        }),
      ],
      shading: { fill: 'ECFDF5', type: ShadingType.CLEAR },
      spacing: { before: 100, after: 300 },
    }),
  ];

  const headerBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  };

  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  };

  weeks.forEach((week) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${week.dates.toUpperCase()}`,
            bold: true,
            size: 22,
            color: '1E293B',
          }),
        ],
        spacing: { before: 240, after: 120 },
      })
    );

    const weekRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            shading: { fill: '334155', type: ShadingType.CLEAR },
            borders: headerBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Day / Time', bold: true, color: 'FFFFFF', size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 36, type: WidthType.PERCENTAGE },
            shading: { fill: '334155', type: ShadingType.CLEAR },
            borders: headerBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Target School', bold: true, color: 'FFFFFF', size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 22, type: WidthType.PERCENTAGE },
            shading: { fill: '334155', type: ShadingType.CLEAR },
            borders: headerBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Corridor & Tab', bold: true, color: 'FFFFFF', size: 18 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 24, type: WidthType.PERCENTAGE },
            shading: { fill: '334155', type: ShadingType.CLEAR },
            borders: headerBorders,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Lab Status & Target', bold: true, color: 'FFFFFF', size: 18 })],
              }),
            ],
          }),
        ],
      }),
    ];

    week.schools.forEach((school, sIdx) => {
      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][sIdx % 6];
      const isEven = sIdx % 2 === 0;
      const rowFill = isEven ? 'FFFFFF' : 'F8FAFC';

      weekRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `${dayName}`, bold: true, size: 18, color: '0F172A' })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: options.window.split(' ')[0] || '09:30 AM', size: 14, color: '64748B' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 36, type: WidthType.PERCENTAGE },
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: school.name, bold: true, size: 18, color: '0F172A' })],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Contact: ${school.contactPerson || 'Office'} (${school.contactPhone || 'Available on Maps'})`,
                      size: 14,
                      color: '64748B',
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: extractAreaFromSchool(school.name, school.area, school.city), bold: true, size: 17, color: '334155' })],
                }),
                new Paragraph({
                  children: [new TextRun({ text: school.sheetName ? `Tab: ${school.sheetName}` : school.city, size: 14, color: '64748B' })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 24, type: WidthType.PERCENTAGE },
              shading: { fill: rowFill, type: ShadingType.CLEAR },
              borders: cellBorders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: school.computerLab === 'Yes' ? '✓ Verified Lab' : school.computerLab === 'No' ? '✗ No Lab' : '? Unverified',
                      bold: true,
                      size: 17,
                      color: school.computerLab === 'Yes' ? '047857' : school.computerLab === 'No' ? 'BE123C' : 'B45309',
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: school.labComputersCount ? `${school.labComputersCount} Computers` : 'Inspect Lab',
                      size: 14,
                      color: '64748B',
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: weekRows,
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanFilename = `Natton_SkillX_Weekly_Itinerary_${options.month.replace(/\s+/g, '_')}.docx`;
  downloadBlob(blob, cleanFilename);
}
