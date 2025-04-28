import fitz  # PyMuPDF
import os

def pdf_to_md(pdf_path, output_dir):
    try:
        doc = fitz.open(pdf_path)
        md_content = ""
        for page in doc:
            md_content += f"# Page {page.number + 1}\n\n"
            md_content += page.get_text("text") + "\n\n"
        doc.close()

        # Save as Markdown
        base_name = os.path.basename(pdf_path).replace(".pdf", ".md")
        md_path = os.path.join(output_dir, base_name)
        with open(md_path, "w", encoding="utf-8") as md_file:
            md_file.write(md_content)
        return md_path
    except Exception as e:
        raise RuntimeError(f"Failed to convert PDF to Markdown: {e}")