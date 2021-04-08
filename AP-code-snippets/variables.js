AddVariable = (title, type, value) => {
    return `
    <w:sdt>
      <w:sdtPr>
        <w:rPr>
          <w:color w:val="000000"/>
          <w:sz w:val="24"/>
          <w:highlight w:val="green"/>
        </w:rPr>
        <w:alias w:val="${titleGenerator(title.toUpperCase()[0]+title.substring(1), type)}"/>
        <w:tag w:val="${title}"/>
      </w:sdtPr>
      <w:sdtContent>
        <w:r>
          <w:rPr>
            <w:color w:val="000000"/>
            <w:sz w:val="24"/>
            <w:highlight w:val="green"/>
          </w:rPr>
          <w:t xml:space="preserve">${value}</w:t>
        </w:r>
      </w:sdtContent>
    </w:sdt>
  `;
  };
