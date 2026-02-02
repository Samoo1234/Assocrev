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

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Strip HTML tags for basic PDF (jsPDF doesn't support HTML natively without plugins)
            const plainText = this.htmlToPlainText(content);

            // Add content
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);

            // Split text into lines that fit the page width
            const lines = pdf.splitTextToSize(plainText, maxWidth);

            let y = margin;
            const lineHeight = 6;
            const pageHeight = pdf.internal.pageSize.getHeight();

            for (const line of lines) {
                if (y + lineHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(line, margin, y);
                y += lineHeight;
            }

            // Generate blob
            const pdfBlob = pdf.output('blob');

            // Upload to Supabase Storage
            const fileName = `ata_${meetingId}_${Date.now()}.pdf`;
            const filePath = `minutes/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                });

            if (uploadError) {
                // If upload fails, just download locally
                saveAs(pdfBlob, `${title}.pdf`);
                return { url: null, error: null };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // Also download locally
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

            // Create document
            const doc = new Document({
                sections: [{
                    properties: {},
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

        // Process each element
        const processNode = (node: Node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent?.trim();
                if (text) {
                    paragraphs.push(new Paragraph({
                        children: [new TextRun(text)],
                    }));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                const tagName = element.tagName.toLowerCase();

                if (tagName === 'h1') {
                    paragraphs.push(new Paragraph({
                        text: element.textContent || '',
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }));
                } else if (tagName === 'h2') {
                    paragraphs.push(new Paragraph({
                        text: element.textContent || '',
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                    }));
                } else if (tagName === 'h3') {
                    paragraphs.push(new Paragraph({
                        text: element.textContent || '',
                        heading: HeadingLevel.HEADING_3,
                    }));
                } else if (tagName === 'p') {
                    const runs: TextRun[] = [];
                    element.childNodes.forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE) {
                            runs.push(new TextRun(child.textContent || ''));
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            const childEl = child as HTMLElement;
                            const isBold = childEl.tagName === 'STRONG' || childEl.tagName === 'B';
                            const isItalic = childEl.tagName === 'EM' || childEl.tagName === 'I';
                            runs.push(new TextRun({
                                text: childEl.textContent || '',
                                bold: isBold,
                                italics: isItalic,
                            }));
                        }
                    });
                    paragraphs.push(new Paragraph({ children: runs }));
                } else if (tagName === 'li') {
                    paragraphs.push(new Paragraph({
                        text: `• ${element.textContent || ''}`,
                    }));
                } else if (tagName === 'ul' || tagName === 'ol') {
                    element.querySelectorAll('li').forEach(li => {
                        paragraphs.push(new Paragraph({
                            text: `• ${li.textContent || ''}`,
                        }));
                    });
                } else {
                    // Process children for other elements
                    element.childNodes.forEach(processNode);
                }
            }
        };

        temp.childNodes.forEach(processNode);

        return paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: html })];
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
