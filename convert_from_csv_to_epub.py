import csv
import os
from ebooklib import epub

# Function to create an EPUB book
def create_epub(book_id, category, title, author, publisher, year, notes, compartment, cover_image_path):
    book = epub.EpubBook()

    # Set metadata
    book.set_identifier(book_id)
    book.set_title(title)
    book.set_language('en')
    book.add_author(author)
    book.add_metadata('DC', 'publisher', publisher)
    book.add_metadata('DC', 'date', year)
    book.add_metadata('DC', 'description', notes)
    book.add_metadata('DC', 'subject', category)
    book.add_metadata('DC', 'coverage', compartment)

    # Add custom content
    content = f"""
    <html>
    <head>
    <title>{title}</title>
    </head>
    <body>
    <h1>{title}</h1>
    <p><strong>Author:</strong> {author}</p>
    <p><strong>Publisher:</strong> {publisher}</p>
    <p><strong>Year:</strong> {year}</p>
    <p><strong>Notes:</strong> {notes}</p>
    <p><strong>Compartment:</strong> {compartment}</p>
    <p>This is a custom content section.</p>
    </body>
    </html>
    """
    chapter = epub.EpubHtml(title='Content', file_name='chap_01.xhtml', lang='en')
    chapter.content = content
    book.add_item(chapter)

    # Add cover image if available
    if os.path.exists(cover_image_path):
        book.set_cover("cover.jpg", open(cover_image_path, 'rb').read())
    else:
        print("Cover does not exsist: " + book_id)

    # Define Table Of Contents
    book.toc = (epub.Link('chap_01.xhtml', 'Content', 'content'),)

    # Add default NCX and Nav file
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # Define CSS style
    style = 'BODY {color: white;}'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    # Create spine
    book.spine = ['nav', chapter]

    # Write to the file
    epub.write_epub(f'{title}.epub', book, {})

# Read the CSV file and create EPUB files
with open('books.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for idx, row in enumerate(reader):
        book_id = row['ID']
        category = row['CATEGORIA']
        title = row['TITOLO']
        author = row['AUTORE'] or "N/D"
        publisher = row['CASA_EDITRICE'] or "N/D"
        year = row['ANNO_PUBBLICAZIONE'] or "N/D"
        notes = row['NOTE'] or "N/D"
        compartment = row['SCOMPARTO'] or "N/D"
        cover_image_path = f'covers/{book_id}.jpg'
        
        if not book_id or not category or not title:
            print("ERROR AT: " + idx+1)
        
        create_epub(book_id, category, title, author, publisher, year, notes, compartment, cover_image_path)

print("EPUB files have been created successfully.")

