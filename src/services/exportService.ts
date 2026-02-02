import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from './supabase';

interface ExportOptions {
    title: string;
    content: string;
    meetingId: string;
}

class ExportService {
    /**
     * Generate PDF from HTML content
     */
    async generatePDF(options: ExportOptions): Promise<{ url: string | null; error: string | null }> {
        try {
            const { title, content, meetingId } = options;

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 25; // Slightly larger margin for professional look
            const maxWidth = pageWidth - (margin * 2);
            let y = margin;

            const temp = document.createElement('div');
            temp.innerHTML = content;

            const addText = (text: string, options: {
                fontSize?: number,
                fontStyle?: 'normal' | 'bold' | 'italic',
                align?: 'left' | 'center',
                marginTop?: number,
                marginBottom?: number
            } = {}) => {
                const {
                    fontSize = 10,
                    fontStyle = 'normal',
                    align = 'left',
                    marginTop = 0,
                    marginBottom = 2
                } = options;

                pdf.setFont('helvetica', fontStyle);
                pdf.setFontSize(fontSize);

                const lines = pdf.splitTextToSize(text, maxWidth);
                const lineHeight = (fontSize * 0.3527) * 1.5; // Font size in mm * line spacing factor

                y += marginTop;

                for (const line of lines) {
                    if (y + lineHeight > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                        // Conserve font settings on new page
                        pdf.setFont('helvetica', fontStyle);
                        pdf.setFontSize(fontSize);
                    }

                    const x = align === 'center'
                        ? (pageWidth - pdf.getTextWidth(line)) / 2
                        : margin;

                    pdf.text(line, x, y + (fontSize * 0.3527)); // adjust for baseline
                    y += lineHeight;
                }

                y += marginBottom;
            };

            const processNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent?.trim();
                    if (text) {
                        addText(text);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as HTMLElement;
                    const tagName = el.tagName.toLowerCase();

                    if (tagName === 'h1') {
                        addText(el.innerText, { fontSize: 16, fontStyle: 'bold', align: 'center', marginBottom: 6 });
                    } else if (tagName === 'h2') {
                        addText(el.innerText, { fontSize: 13, fontStyle: 'bold', align: 'center', marginBottom: 4 });
                    } else if (tagName === 'h3') {
                        addText(el.innerText, { fontSize: 11, fontStyle: 'bold', marginTop: 4, marginBottom: 2 });
                    } else if (tagName === 'p') {
                        addText(el.innerText, { fontSize: 10, marginBottom: 3 });
                    } else if (tagName === 'li') {
                        addText(`• ${el.innerText}`, { fontSize: 10, marginBottom: 1 });
                    } else if (tagName === 'ul' || tagName === 'ol') {
                        Array.from(el.childNodes).forEach(processNode);
                        y += 2; // Gap after list
                    } else if (tagName === 'div') {
                        // Handle signature blocks or other divs as potential containers
                        Array.from(el.childNodes).forEach(processNode);
                    } else if (tagName === 'br') {
                        y += 5;
                    }
                }
            };

            // Start processing top-level nodes
            Array.from(temp.childNodes).forEach(processNode);

            // Generate blob
            const pdfBlob = pdf.output('blob');

            // Upload and Download logic follows...
            const fileName = `ata_${meetingId}_${Date.now()}.pdf`;
            const filePath = `minutes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                });

            if (uploadError) {
                saveAs(pdfBlob, `${title}.pdf`);
                return { url: null, error: null };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            saveAs(pdfBlob, `${title}.pdf`);

            return { url: publicUrl, error: null };
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            return { url: null, error: 'Erro ao gerar PDF' };
        }
    }

    /**
     * Generate DOCX from HTML content
     */
    async generateDOCX(options: ExportOptions): Promise<{ url: string | null; error: string | null }> {
        try {
            const { title, content, meetingId } = options;

            // Parse HTML content to paragraphs
            const paragraphs = this.htmlToParagraphs(content);

            // Create document with professional settings
            const doc = new Document({
                sections: [{
                    properties: {
                        page: {
                            margin: {
                                top: 1440, // 1 inch = 1440 twips
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                    children: paragraphs,
                }],
            });

            // Generate blob
            const docxBlob = await Packer.toBlob(doc);

            // Upload to Supabase Storage
            const fileName = `ata_${meetingId}_${Date.now()}.docx`;
            const filePath = `minutes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, docxBlob, {
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

            if (uploadError) {
                // If upload fails, just download locally
                saveAs(docxBlob, `${title}.docx`);
                return { url: null, error: null };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Also download locally
            saveAs(docxBlob, `${title}.docx`);

            return { url: publicUrl, error: null };
        } catch (err) {
            console.error('Erro ao gerar DOCX:', err);
            return { url: null, error: 'Erro ao gerar DOCX' };
        }
    }

    /**
     * Convert HTML to plain text
     */
    private htmlToPlainText(html: string): string {
        // Create temporary element
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Replace br and block elements with newlines
        temp.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        temp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li').forEach(el => {
            el.prepend(document.createTextNode('\n'));
            el.append(document.createTextNode('\n'));
        });

        // Get text and clean up multiple newlines
        let text = temp.textContent || temp.innerText || '';
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        return text;
    }

    /**
     * Convert HTML to DOCX paragraphs
     */
    private htmlToParagraphs(html: string): Paragraph[] {
        const paragraphs: Paragraph[] = [];
        const temp = document.createElement('div');
        temp.innerHTML = html;

        const processElement = (element: HTMLElement): Paragraph | null => {
            const tagName = element.tagName.toLowerCase();
            const text = element.innerText || element.textContent || '';
            if (!text.trim() && tagName !== 'br') return null;

            if (tagName === 'h1') {
                return new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 200 },
                });
            }

            if (tagName === 'h2') {
                return new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 300, after: 200 },
                });
            }

            if (tagName === 'h3') {
                return new Paragraph({
                    text: text,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 200, after: 100 },
                });
            }

            if (tagName === 'p' || tagName === 'div') {
                // Check if it's a signature line (very simple detection)
                const isSignature = element.style.borderTop !== '' || text.includes('Presidente') || text.includes('Secretário');

                return new Paragraph({
                    alignment: isSignature ? AlignmentType.CENTER : AlignmentType.BOTH,
                    spacing: { line: 360, after: 120 }, // 1.5 line spacing
                    children: [
                        new TextRun({
                            text: text,
                            size: 22, // 11pt
                            font: 'Times New Roman',
                        })
                    ]
                });
            }

            if (tagName === 'li') {
                return new Paragraph({
                    bullet: { level: 0 },
                    children: [new TextRun({ text: text, size: 22, font: 'Times New Roman' })],
                });
            }

            return null;
        };

        const walk = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();

                if (['h1', 'h2', 'h3', 'p', 'li'].includes(tagName)) {
                    const p = processElement(el);
                    if (p) paragraphs.push(p);
                } else if (tagName === 'ul' || tagName === 'ol' || tagName === 'div') {
                    Array.from(el.childNodes).forEach(walk);
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) {
                    paragraphs.push(new Paragraph({
                        children: [new TextRun({ text, size: 22, font: 'Times New Roman' })],
                        alignment: AlignmentType.BOTH,
                        spacing: { after: 120 }
                    }));
                }
            }
        };

        Array.from(temp.childNodes).forEach(walk);

        return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: 'Ata sem conteúdo' })];
    }

    /**
     * Download content as file (local only, no upload)
     */
    downloadHTML(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        saveAs(blob, `${filename}.html`);
    }
}

export const exportService = new ExportService();
