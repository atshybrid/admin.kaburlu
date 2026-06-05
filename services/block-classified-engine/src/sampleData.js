/** Re-export sample shape — engine uses bridge to backend renderer */
export function getClassifiedSample() {
  return {
    sectionTitle: 'వర్గీకరణా విభాగం',
    paperName: 'భారత్ దర్శన్',
    bookingPhone: '040-2345 6789 / 98480 00000',
    editionLabel: 'హైదరాబాద్ · బుధవారం, 03-06-2026',
    categories: [
      {
        name: 'వివాహ విభాగం',
        ads: [
          {
            ref: 'M-2401',
            title: 'వరుడు కావలి',
            lines: ['B.Tech · USA H1B · 1988 · 5′9″ · Brahmin', 'Non-Dowry · Parents Hyderabad'],
            contact: '98480 11234',
            featured: true,
          },
          {
            ref: 'M-2402',
            title: 'వధువు కావలి',
            lines: ['M.Sc B.Ed · Teacher · Karimnagar', '1992 · Horoscope match'],
            contact: '99890 55667',
            featured: true,
          },
          { ref: 'M-2403', title: 'వరుడు MBA', lines: ['1986 · Reddy · Business'], contact: '91234 00987' },
        ],
      },
      {
        name: 'ఉద్యోగ విభాగం',
        ads: [
          { ref: 'J-881', title: 'Sales — Pharma', lines: ['2+ yrs · Bike · Hyderabad'], contact: '90000 12345' },
          { ref: 'J-882', title: 'Accountant', lines: ['Tally · GST · Warangal'], contact: '98765 43210' },
        ],
      },
      {
        name: 'ఆస్తి · నివాస విభాగం',
        ads: [
          {
            ref: 'P-501',
            title: '2BHK విక్రయం',
            lines: ['Kukatpally · 1100 sft · Ready'],
            contact: '98490 77889',
            featured: true,
          },
        ],
      },
      {
        name: 'వాహన విభాగం',
        ads: [{ ref: 'V-119', title: 'Swift 2019', lines: ['Single owner · 42k km'], contact: '95501 22000' }],
      },
    ],
  };
}
