
import jsPDF from 'jspdf';

const IMAGE_REGEX = /!\[(.*?)\]\((data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)\)/;
const PT_TO_MM = 0.352778;

type TocEntry = { title: string, page: number };
type FontSettings = {
  fontFamily: string;
  headingSize: number;
  bodySize: number;
  lineSpacing: number;
};

const getPdfFontName = (fontFamily: string) => {
    switch (fontFamily) {
        case 'Arial': return 'helvetica';
        case 'Courier New': return 'courier';
        case 'Times New Roman':
        default: return 'times';
    }
};

class PdfDocument {
    doc: jsPDF;
    y: number;
    pageWidth: number;
    margin: number;
    contentWidth: number;
    tocData: TocEntry[] = [];
    isDryRun: boolean;
    fontSettings: FontSettings;
    pdfFontName: string;

    constructor(isDryRun = false, fontSettings: FontSettings) {
        this.doc = new jsPDF('p', 'mm', 'a4');
        this.margin = 15;
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.contentWidth = this.pageWidth - this.margin * 2;
        this.y = this.margin;
        this.isDryRun = isDryRun;
        this.fontSettings = fontSettings;
        this.pdfFontName = getPdfFontName(fontSettings.fontFamily);
    }

    getCurrentPage(): number {
        // FIX: Cast to 'any' to bypass potential incomplete type definitions for jsPDF.
        return (this.doc.internal as any).getCurrentPageInfo().pageNumber;
    }

    checkPageBreak(heightNeeded: number) {
        if (this.y + heightNeeded > this.doc.internal.pageSize.getHeight() - this.margin) {
            if (!this.isDryRun) {
                this.doc.addPage();
            } else {
                // In dry run, we manually increment page count
                (this.doc.internal as any).pages.push({});
            }
            this.y = this.margin;
        }
    }

    async addImage(src: string, alt: string) {
        const heightNeeded = 60; // Approximate height for an image + caption
        this.checkPageBreak(heightNeeded);
        
        if (!this.isDryRun) {
            try {
                const img = new Image();
                img.src = src;
                await new Promise(resolve => img.onload = resolve);
                
                const aspectRatio = img.width / img.height;
                let imgWidth = this.contentWidth;
                let imgHeight = imgWidth / aspectRatio;

                const maxHeight = (this.doc.internal.pageSize.getHeight() - this.margin * 2) * 0.6;
                if (imgHeight > maxHeight) {
                    imgHeight = maxHeight;
                    imgWidth = imgHeight * aspectRatio;
                }
                
                this.checkPageBreak(imgHeight + 8); 
                this.doc.addImage(src, 'PNG', this.margin + (this.contentWidth - imgWidth) / 2, this.y, imgWidth, imgHeight);
                this.y += imgHeight + 3;

                this.doc.setFont(this.pdfFontName, 'italic');
                this.doc.setFontSize(9);
                this.doc.setTextColor(128, 128, 128);
                const captionLines = this.doc.splitTextToSize(alt, this.contentWidth);
                this.checkPageBreak(captionLines.length * 3.5);
                this.doc.text(captionLines, this.pageWidth / 2, this.y, { align: 'center' });
                this.y += captionLines.length * 3.5 + 5;
                this.doc.setTextColor(0, 0, 0);
            } catch (e) {
                console.error("Error adding image to PDF", e);
                this.y += heightNeeded; // Still advance y on error
            }
        } else {
            this.y += heightNeeded;
        }
    }

    addText(text: string, size: number, style: 'normal' | 'bold' | 'italic', spaceAfter: number, recordToc = false) {
        this.doc.setFontSize(size);
        const lines = this.doc.splitTextToSize(text, this.contentWidth);
        const textHeight = lines.length * size * PT_TO_MM * this.fontSettings.lineSpacing;
        this.checkPageBreak(textHeight);

        if (recordToc) {
            this.tocData.push({ title: text, page: this.getCurrentPage() });
        }

        if (!this.isDryRun) {
            this.doc.setFont(this.pdfFontName, style);
            this.doc.text(lines, this.margin, this.y, { lineHeightFactor: this.fontSettings.lineSpacing });
        }
        this.y += textHeight + spaceAfter;
    }

    addListItem(text: string, isTocItem = false) {
        this.doc.setFont(this.pdfFontName, 'normal');
        this.doc.setFontSize(this.fontSettings.bodySize);
        const bullet = '\u2022';
        const itemText = this.doc.splitTextToSize(text, this.contentWidth - 5);
        const textHeight = itemText.length * this.fontSettings.bodySize * PT_TO_MM * this.fontSettings.lineSpacing;
        this.checkPageBreak(textHeight);
        
        if (!this.isDryRun) {
            if (isTocItem) {
                const parts = text.split('\t');
                const title = parts[0];
                const page = parts[1];
                this.doc.text(title, this.margin, this.y);
                const titleWidth = this.doc.getTextWidth(title);
                const dotsWidth = this.contentWidth - titleWidth - this.doc.getTextWidth(page) - 5;
                if (dotsWidth > 0) {
                    const dots = '.'.repeat(Math.floor(dotsWidth / this.doc.getTextWidth('.')));
                    this.doc.text(dots, this.margin + titleWidth + 2, this.y);
                }
                this.doc.text(page, this.pageWidth - this.margin - this.doc.getTextWidth(page), this.y);
            } else {
                this.doc.text(bullet, this.margin, this.y, { lineHeightFactor: this.fontSettings.lineSpacing });
                this.doc.text(itemText, this.margin + 5, this.y, { lineHeightFactor: this.fontSettings.lineSpacing });
            }
        }
        this.y += textHeight + 1; // Add 1mm spacing after list item
    }

    addPageNumbers() {
        const pageCount = this.doc.getNumberOfPages();
        
        if (pageCount <= 1) {
            return;
        }

        this.doc.setFont(this.pdfFontName, 'normal');
        this.doc.setFontSize(9);
        this.doc.setTextColor(128);

        for (let i = 1; i <= pageCount; i++) {
            this.doc.setPage(i);
            const pageInfo = `Page ${i} of ${pageCount}`;
            this.doc.text(
                pageInfo, 
                this.pageWidth / 2, 
                this.doc.internal.pageSize.getHeight() - 10, 
                { align: 'center' }
            );
        }
    }

    save(filename: string) {
        this.addPageNumbers();
        this.doc.save(`${filename}.pdf`);
    }
}

async function processMarkdown(doc: PdfDocument, markdown: string) {
    const lines = markdown.split('\n');
    let inList = false;
    let inTocList = false;
    const { headingSize, bodySize } = doc.fontSettings;

    for (const line of lines) {
        const trimmedLine = line.trim();
        const imageMatch = line.match(IMAGE_REGEX);

        if (imageMatch) {
            inList = false;
            inTocList = false;
            await doc.addImage(imageMatch[2], imageMatch[1]);
            continue;
        }

        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            if (!inList) {
                inList = true;
                doc.y += 2; 
            }
            doc.addListItem(trimmedLine.substring(2), inTocList);
            continue;
        }
        
        inList = false;
        inTocList = false;

        if (line.startsWith('# ')) {
            doc.addText(line.substring(2), headingSize + 4, 'bold', 6);
        } else if (line.startsWith('## ')) {
            const title = line.substring(3);
            // The Table of Contents itself should not be recorded in the TOC data.
            inTocList = title.includes('Table of Contents');
            
            // Sections like Abstract, Keywords, and References are fundamental parts of the paper
            // but are not typically listed in the Table of Contents. This logic ensures they are 
            // rendered correctly in the PDF but excluded from the TOC data used for navigation.
            const shouldRecordInToc = !inTocList && !title.includes('Abstract') && !title.includes('Keywords') && !title.includes('References');

            doc.addText(title, headingSize + 2, 'bold', 5, shouldRecordInToc);
        } else if (line.startsWith('### ')) {
            doc.addText(line.substring(4), headingSize, 'bold', 4);
        } else if (trimmedLine !== '' && !trimmedLine.startsWith('<!-- TOC -->')) {
            doc.addText(line, bodySize, 'normal', 4);
        }
    }
}


export const calculateTocData = async (markdown: string, fontSettings: FontSettings): Promise<TocEntry[]> => {
    const dryRunDoc = new PdfDocument(true, fontSettings);
    await processMarkdown(dryRunDoc, markdown.replace('<!-- TOC -->', ''));
    return dryRunDoc.tocData;
};


export const generatePdfFromMarkdown = async (markdown: string, filename: string, fontSettings: FontSettings) => {
    const tocData = await calculateTocData(markdown, fontSettings);
    let tocMarkdown = '';
    if (tocData.length > 0) {
        tocMarkdown = tocData.map(item => `- ${item.title}\t${item.page}`).join('\n');
    }
    const finalMarkdown = markdown.replace('<!-- TOC -->', tocMarkdown);
    
    const doc = new PdfDocument(false, fontSettings);
    await processMarkdown(doc, finalMarkdown);
    doc.save(filename);
};
