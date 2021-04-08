AddHeading = (heading, value, level) => {
    const definedLevels = {
      1: { style: Word.Style.heading1, size: 25 },
      2: { style: Word.Style.heading2, size: 20 },
      3: { style: Word.Style.heading3, size: 16 },
      4: { style: Word.Style.heading4, size: 16 },
      5: { style: Word.Style.heading5, size: 16 },
      6: { style: Word.Style.heading6, size: 16 },
    };
  
    return `
  <w:sdt>
    <w:sdtPr>
      <w:alias w:val="${titleGenerator(heading.toUpperCase()[0]+heading.substring(1), 'Heading')}"/>
      <w:tag w:val="${heading}"/>
      <w:pPr>
        <w:pStyle w:val="${definedLevels[level].style}"/>
      </w:pPr>
    </w:sdtPr>
    <w:sdtContent>
      <w:r>
        <w:rPr>
          <w:sz w:val="${definedLevels[level].size * 2}"/>
         </w:rPr>
        <w:t xml:space="preserve">${value}</w:t>
      </w:r>
    </w:sdtContent>
  </w:sdt>
    `;
  };
