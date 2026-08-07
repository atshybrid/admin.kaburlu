function Value({ children, className = '' }) {
  return <span className={`value ${className}`}>{children || ''}</span>
}

function Row({ number, label, children, className = '' }) {
  return <div className={`row ${className}`}><span className="label">{number ? `${number}. ` : ''}{label}</span><span className="colon">:</span><Value>{children}</Value></div>
}

function PublicationTable({ rows }) {
  const values = (rows || []).slice(0, 2)
  return <table className="publication-table"><thead><tr><th>Names of the<br />publication</th><th>Language</th><th>Periodicity</th><th>RNI</th></tr></thead>
    <tbody>
      <tr className="column-numbers"><td>1</td><td>2</td><td>3</td><td>4</td></tr>
      {[0, 1].map((index) => <tr className="data-row" key={index}>{['name', 'language', 'periodicity', 'rni'].map((key) => <td key={key}><span>{values[index]?.[key] || ''}</span></td>)}</tr>)}
    </tbody>
  </table>
}

export default function EmpanelmentPdfDocument({ form }) {
  const staff = (form.staff || []).map((member) => [member.role, member.name, member.phone, member.address, member.salary].filter(Boolean).join(' — ')).join('\n')
  return (
    <div className="ipr-document" aria-hidden="true">
      <section className="page">
        <header className="government-header"><div>GOVERNMENT OF TELANGANA</div><div>DEPARTMENT OF INFORMATION AND PUBLIC RELATIONS :: HYDERABAD.</div><div>* * *</div>
          <h1>Application form for Empanelment of small newspapers for fixation of rates<br /><small>(Telugu, English, Hindi and Urdu)</small></h1></header>
        <div className="date">Date: {form.declarationDate || ''}</div>
        <h2>Part - A:</h2>
        <div className="rows">
          <Row number="1" label="Name of the Newspaper">{form.newspaperName}</Row>
          <Row number="2" label="Name of the Publisher">{form.publisherName}</Row>
          <Row number="3" label="Address with telephone No.">{form.publisherAddress}</Row>
          <Row number="4" label="Mail ID">{form.publisherEmail}</Row>
          <Row number="5" label="Name of the Editor">{form.editorName}</Row>
          <Row label="a) Educational Qualification (enclose copies)">{form.editorQualification}</Row>
          <Row label="b) Existing Accreditation No.">{form.accreditationNo}</Row>
          <Row number="6" label="Address with Telephone No.">{form.editorAddress}</Row>
          <Row number="7" label="Mail ID">{form.editorEmail}</Row>
          <Row number="8" label="Language">{form.language}</Row>
          <Row number="9" label="Date of establishment">{form.establishmentDate}</Row>
          <Row number="10" label="Date of Empanelment in I&PR (if existing)">{form.previousEmpanelmentDate}</Row>
          <Row number="11" label="Place of publication">{form.publicationPlace}</Row>
          <Row number="12" label="PAN No. of Publisher">{form.panNo}</Row>
          <Row number="13" label="R.N.I. No. & Year (enclose copy)">{form.rniNo}</Row>
          <Row number="14" label="No. of pages">{form.pageCount}</Row>
          <Row number="15" label="No. of Editions (give details)">{form.editions}</Row>
        </div>
      </section>

      <section className="page">
        <div className="rows top-gap">
          <Row number="16" label="Size of the paper">{form.paperSize}</Row>
          <Row number="17" label="Colour or Black & White">{form.printColour}</Row>
          <Row number="18" label="Price (per copy)">{form.copyPrice}</Row>
          <Row number="19" label="No. of papers printed daily">{form.dailyPrintCount}</Row>
          <Row label="a) If colour No. of colour pages">{form.colourPageCount}</Row>
          <Row number="20" label="Circulation (ABC or IRS or CA)">{form.circulation}</Row>
          <Row number="21" label="Name of the press where newspapers is printed with address & telephone No." className="tall">{form.pressDetails}</Row>
          <Row number="22" label="Is it own press or outside press">{form.pressOwnership}</Row>
          <Row label="a) Capacity of press">{form.pressCapacity ? `${form.pressCapacity} copies/hour` : ''}</Row>
          <Row label="b) Type of press">{form.pressType}</Row>
        </div>
        <h2>Part - B</h2><p className="intro">In case of C.A./RNI certification of circulation:</p>
        <div className="rows compact"><Row number="23" label="Quantity of news print used per day">{form.newsprintQuantity}</Row><Row number="24" label="If the newspaper is distributed through agents, list of agents with addresses and telephone nos.">{form.agentDetails}</Row><Row number="25" label="Enclose District wise & Mandal wise circulation">{form.districtMandalCirculation}</Row></div>
        <h2>Part - C</h2><div className="rows compact"><Row number="26" label="If the newspaper is DAVP empanelled">{form.davpEmpanelled}</Row><Row number="27" label="If yes — DAVP code / No. of copies / Rate for sq.cm.">{[form.davpCode, form.davpCopies, form.davpRate].filter(Boolean).join(' / ')}</Row></div>
      </section>

      <section className="page">
        <h2>Part - D - Staff</h2><Row number="28" label="Enclose list of staff details with names, address, phone numbers, salary particulars, working in office & field." className="staff"><pre>{staff}</pre></Row>
        <h2>Part - E</h2><Row number="29" label="Give details of other publications if any by the same Publisher" /><PublicationTable rows={form.publisherPublications} />
        <Row number="30" label="Give details of other publications if any by the same Editor" /><PublicationTable rows={form.editorPublications} />
        <h3>DECLARATION</h3>
        <ol className="declaration"><li>I affirm that all the information given by me is true and nothing has been concealed.</li><li>The paper is regular for (18) months and has circulation of not less than 5000 copies per day.</li><li>The paper is not suspended/black listed/cancelled in the past.</li></ol>
        <div className="signature"><strong>Signature of the publisher/Editor</strong><br /><Value>{form.signatoryName}</Value></div>
        <div className="place">Date : {form.declarationDate}<br />Place : {form.declarationPlace}</div>
      </section>

      <section className="page terms">
        <h2>II. TERMS AND CONDITIONS FOR EMPANELMENT AND RATE FIXATION FOR SMALL NEWSPAPERS:</h2>
        <ol>
          <li>The paper should invariably possess registration number allotted by Registrar of Newspapers for India (enclose copy).</li>
          <li>Empanelment shall be allowed 18 (eighteen) months from the date of RNI Certificate.</li>
          <li>The paper should invariably have a regularity of (18) months publication without any interruption and continuity of publication.</li>
          <li>Circulation shall not be less than 5,000 copies per day.</li>
          <li>The empanelment of the paper should not have been cancelled or black listed or under suspension in the past.</li>
          <li>Chartered Accountant’s Certificate in support of circulation should be furnished by the newspaper concerned (in case ABC or IRS figures not available).</li>
          <li>Printer and Publisher certificate should be furnished.</li>
          <li>The size of the newspaper should be minimum (4) pages in demy size.</li>
          <li>The contents of the newspapers shall include news emanating from the Government and its departments on social, political, economic, developmental and other matters of public interest & public importance.</li>
          <li>A daily newspaper shall be published not less than (Six) 6 days in a week. Advertisements shall be given only to the newspapers published 25 days in a month.</li>
          <li>The newspaper will be suspended from empanelment by the department with immediate effect if:<br />A) It is found to have submitted false information regarding circulation.<br />B) Found to have discontinued the publication, changed its periodicity or its title or have become irregular or changes its premises/press without due intimation.<br />C) Indulge in un-ethical practices or anti-national activities.<br />D) Convicted by the court of law for such activities.</li>
          <li>A committee will be constituted to examine and scrutinize the applications and inspect the newspaper offices where ever required.</li>
          <li>The committee will decide the category of newspaper & rates of advertisement.</li>
          <li>Enclose balance sheet for last (2) financial years.</li>
          <li>Enclose copies of IT returns for last (2) assessment years.</li>
          <li>Enclose copies of RNI returns for 2014-15 and 2015-16.</li>
          <li>Enclose list of staff with particulars.</li>
          <li>Commissioner, I&amp;PR reserves the right for rejection of any/all applications without assigning any reasons whatsoever. All decisions taken by the Commissioner, I&amp;PR Department would be final and no further representation/correspondence in this regard will be entertained.</li>
        </ol>
        <p className="center">***</p>
      </section>

      <style jsx global>{`
        .ipr-document { width: 630px; color: #242424; font-family: Verdana, Geneva, sans-serif; font-size: 10px; line-height: 1.22; background: #fff; }
        .page { box-sizing: border-box; position: relative; width: 630px; height: 1000px; padding: 66px 68px 48px 78px; background: #fff; page-break-after: always; overflow: hidden; }
        .government-header { text-align: center; font-size: 11px; letter-spacing: .15px; }
        .government-header h1 { margin: 10px 0 0; font-size: 13px; text-decoration: underline; line-height: 1.15; }
        .government-header small { font-size: 10px; }
        .date { margin: 3px 0 14px auto; width: 140px; font-weight: bold; text-decoration: underline; }
        h2 { margin: 12px 0; font-size: 13px; text-decoration: underline; }
        h3 { margin: 18px 0 12px; text-align: center; font-size: 13px; text-decoration: underline; }
        .row { display: grid; grid-template-columns: 218px 12px 1fr; min-height: 35px; align-items: start; }
        .row .label { padding-right: 5px; } .colon { text-align: center; } .value { display: block; min-height: 13px; overflow-wrap: anywhere; color: #0d2340; }
        .row.tall { min-height: 66px; } .row.staff { min-height: 115px; } .row.staff pre { white-space: pre-wrap; margin: 0; font: inherit; color: #0d2340; }
        .top-gap { margin-top: 47px; } .compact .row { min-height: 41px; } .intro { margin: -4px 0 12px; }
        .publication-table { width: 100%; border-collapse: collapse; margin: 8px 0 21px; table-layout: fixed; font-size: 9px; }
        .publication-table th, .publication-table td { border: 1px solid #666; box-sizing: border-box; padding: 3px 5px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; }
        .publication-table th { height: 42px; font-weight: normal; line-height: 1.05; } .publication-table td { line-height: 1.12; } .publication-table td span { display: block; min-height: 12px; } .publication-table .column-numbers td { height: 28px; padding: 4px; vertical-align: middle; line-height: 1; } .publication-table .data-row td { height: 32px; padding: 6px 7px; vertical-align: middle; }
        .declaration { margin: 0 0 0 15px; padding: 0; font-size: 10px; } .declaration li { margin: 3px 0; }
        .signature { margin: 35px 0 0 273px; text-align: center; } .place { position: absolute; left: 62px; bottom: 115px; }
        .terms { padding: 73px 65px 42px 85px; font-family: Verdana, Geneva, sans-serif; font-size: 11.5px; line-height: 1.34; letter-spacing: 0; } .terms h2 { font-size: 12.5px; margin: 0 0 17px; line-height: 1.18; } .terms ol { margin: 0; padding-left: 24px; list-style-type: decimal; list-style-position: outside; } .terms li { margin: 4px 0; padding-left: 2px; } .center { margin-top: 12px; text-align: center; font-size: 16px; }
      `}</style>
    </div>
  )
}
